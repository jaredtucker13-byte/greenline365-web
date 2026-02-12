"""
Campaign Manager & Unified Calendar API Tests
Tests CRUD operations for campaigns and calendar endpoints

Endpoints tested:
- GET /api/campaigns - List campaigns
- POST /api/campaigns - Create campaign
- GET /api/campaigns/{id} - Get campaign details
- PATCH /api/campaigns/{id} - Update campaign
- DELETE /api/campaigns/{id} - Delete campaign
- POST /api/campaigns/{id}/contacts - Import contacts
- PATCH /api/campaigns/{id}/contacts - Update contact pipeline stage
- GET /api/calendar/unified - Get unified calendar events
- POST /api/calendar/unified - Create calendar event
- PATCH /api/calendar/unified - Update calendar event
- DELETE /api/calendar/unified - Delete calendar event
"""
import pytest
import requests
import uuid
from datetime import datetime, timedelta

BASE_URL = "http://localhost:3000"

# Test campaign ID from context
TEST_EXISTING_CAMPAIGN_ID = "fe866600-5c64-4384-97fc-5a66ca93caa7"

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestCampaignsListAPI:
    """Test GET /api/campaigns - List campaigns"""
    
    def test_get_campaigns_list(self, api_client):
        """GET /api/campaigns returns list of campaigns"""
        response = api_client.get(f"{BASE_URL}/api/campaigns")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "campaigns" in data, "Response should have 'campaigns' key"
        assert isinstance(data["campaigns"], list), "campaigns should be a list"
        
        # If campaigns exist, verify structure
        if len(data["campaigns"]) > 0:
            campaign = data["campaigns"][0]
            assert "id" in campaign, "Campaign should have 'id'"
            assert "name" in campaign, "Campaign should have 'name'"
            assert "status" in campaign, "Campaign should have 'status'"
            print(f"PASS: GET /api/campaigns returned {len(data['campaigns'])} campaigns")
    
    def test_get_campaigns_with_status_filter(self, api_client):
        """GET /api/campaigns?status=draft filters by status"""
        response = api_client.get(f"{BASE_URL}/api/campaigns?status=draft")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "campaigns" in data
        
        # All returned campaigns should have status=draft if any exist
        for campaign in data["campaigns"]:
            assert campaign.get("status") == "draft", f"Expected status 'draft', got '{campaign.get('status')}'"
        
        print(f"PASS: GET /api/campaigns?status=draft returned {len(data['campaigns'])} draft campaigns")

    def test_get_campaigns_with_limit(self, api_client):
        """GET /api/campaigns?limit=5 limits results"""
        response = api_client.get(f"{BASE_URL}/api/campaigns?limit=5")
        
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["campaigns"]) <= 5, "Should return at most 5 campaigns"
        print(f"PASS: GET /api/campaigns?limit=5 returned {len(data['campaigns'])} campaigns (max 5)")


class TestCampaignCRUD:
    """Test Campaign CRUD lifecycle: Create -> Get -> Update -> Delete"""
    
    @pytest.fixture
    def test_campaign_data(self):
        """Test campaign payload"""
        return {
            "name": f"TEST_Campaign_{uuid.uuid4().hex[:8]}",
            "description": "Test campaign for automated testing",
            "subject": "Test Email Subject",
            "sequence": [
                {"step": 1, "delay_days": 0, "template": "initial_outreach"},
                {"step": 2, "delay_days": 3, "template": "follow_up_1"}
            ],
            "audience_filter": {"city": "Tampa", "industry": "services"},
            "sender_config": {"emails": ["test@example.com"], "rotation": "round-robin"}
        }
    
    def test_create_campaign(self, api_client, test_campaign_data):
        """POST /api/campaigns creates a new campaign"""
        response = api_client.post(f"{BASE_URL}/api/campaigns", json=test_campaign_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should have success=true"
        assert "campaign" in data, "Response should have 'campaign'"
        
        campaign = data["campaign"]
        assert campaign["name"] == test_campaign_data["name"], "Campaign name should match"
        assert campaign["recipient_list"] == "custom", "recipient_list should be 'custom'"
        assert "id" in campaign, "Campaign should have ID"
        
        # Store for cleanup
        self.__class__.created_campaign_id = campaign["id"]
        print(f"PASS: POST /api/campaigns created campaign with ID: {campaign['id']}")
        
        return campaign["id"]
    
    def test_get_campaign_by_id(self, api_client):
        """GET /api/campaigns/{id} returns campaign details"""
        campaign_id = getattr(self.__class__, 'created_campaign_id', TEST_EXISTING_CAMPAIGN_ID)
        
        response = api_client.get(f"{BASE_URL}/api/campaigns/{campaign_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "campaign" in data, "Response should have 'campaign'"
        
        campaign = data["campaign"]
        assert campaign["id"] == campaign_id, "Campaign ID should match"
        assert "sequence" in campaign, "Campaign should have 'sequence'"
        assert "contacts" in campaign, "Campaign should have 'contacts'"
        assert "pipeline_summary" in campaign, "Campaign should have 'pipeline_summary'"
        
        # Verify sends array is returned
        assert "sends" in data, "Response should have 'sends' array"
        
        print(f"PASS: GET /api/campaigns/{campaign_id} returned campaign with {len(campaign.get('contacts', []))} contacts")
    
    def test_update_campaign_name(self, api_client):
        """PATCH /api/campaigns/{id} updates campaign name"""
        campaign_id = getattr(self.__class__, 'created_campaign_id', TEST_EXISTING_CAMPAIGN_ID)
        
        new_name = f"TEST_Updated_Campaign_{uuid.uuid4().hex[:8]}"
        response = api_client.patch(
            f"{BASE_URL}/api/campaigns/{campaign_id}",
            json={"name": new_name}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should have success=true"
        
        # Verify update persisted via GET
        get_response = api_client.get(f"{BASE_URL}/api/campaigns/{campaign_id}")
        assert get_response.status_code == 200
        
        campaign = get_response.json()["campaign"]
        assert campaign["name"] == new_name, f"Campaign name should be updated to '{new_name}'"
        
        print(f"PASS: PATCH /api/campaigns/{campaign_id} updated name to '{new_name}'")
    
    def test_update_campaign_status(self, api_client):
        """PATCH /api/campaigns/{id} updates campaign status"""
        campaign_id = getattr(self.__class__, 'created_campaign_id', TEST_EXISTING_CAMPAIGN_ID)
        
        response = api_client.patch(
            f"{BASE_URL}/api/campaigns/{campaign_id}",
            json={"status": "scheduled"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify status updated
        get_response = api_client.get(f"{BASE_URL}/api/campaigns/{campaign_id}")
        campaign = get_response.json()["campaign"]
        assert campaign["status"] == "scheduled", "Campaign status should be 'scheduled'"
        
        # Reset to draft for cleanup
        api_client.patch(f"{BASE_URL}/api/campaigns/{campaign_id}", json={"status": "draft"})
        
        print(f"PASS: PATCH /api/campaigns/{campaign_id} updated status to 'scheduled'")
    
    def test_update_campaign_sequence(self, api_client):
        """PATCH /api/campaigns/{id} updates campaign sequence"""
        campaign_id = getattr(self.__class__, 'created_campaign_id', TEST_EXISTING_CAMPAIGN_ID)
        
        new_sequence = [
            {"step": 1, "delay_days": 0, "template": "updated_initial"},
            {"step": 2, "delay_days": 2, "template": "updated_followup"},
            {"step": 3, "delay_days": 5, "template": "final_followup"}
        ]
        
        response = api_client.patch(
            f"{BASE_URL}/api/campaigns/{campaign_id}",
            json={"sequence": new_sequence}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify sequence updated
        get_response = api_client.get(f"{BASE_URL}/api/campaigns/{campaign_id}")
        campaign = get_response.json()["campaign"]
        assert len(campaign["sequence"]) == 3, "Sequence should have 3 steps"
        
        print(f"PASS: PATCH /api/campaigns/{campaign_id} updated sequence to 3 steps")
    
    def test_delete_campaign(self, api_client, test_campaign_data):
        """DELETE /api/campaigns/{id} deletes a campaign"""
        # Create a campaign specifically for deletion
        create_response = api_client.post(f"{BASE_URL}/api/campaigns", json={
            "name": f"TEST_ToDelete_{uuid.uuid4().hex[:8]}",
            "description": "Campaign to be deleted"
        })
        assert create_response.status_code == 200
        delete_campaign_id = create_response.json()["campaign"]["id"]
        
        # Delete the campaign
        response = api_client.delete(f"{BASE_URL}/api/campaigns/{delete_campaign_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should have success=true"
        
        # Verify campaign is deleted (GET should return error)
        get_response = api_client.get(f"{BASE_URL}/api/campaigns/{delete_campaign_id}")
        # Should return 404 or error for deleted campaign
        assert get_response.status_code in [404, 500] or "error" in get_response.json(), "Deleted campaign should not be found"
        
        print(f"PASS: DELETE /api/campaigns/{delete_campaign_id} successfully deleted campaign")


class TestCampaignContactsAPI:
    """Test Campaign Contacts management endpoints"""
    
    def test_get_campaign_contacts(self, api_client):
        """GET /api/campaigns/{id}/contacts returns contacts list"""
        response = api_client.get(f"{BASE_URL}/api/campaigns/{TEST_EXISTING_CAMPAIGN_ID}/contacts")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "contacts" in data, "Response should have 'contacts'"
        assert "total" in data, "Response should have 'total'"
        assert isinstance(data["contacts"], list), "contacts should be a list"
        
        print(f"PASS: GET /api/campaigns/{TEST_EXISTING_CAMPAIGN_ID}/contacts returned {data['total']} contacts")
    
    def test_get_contacts_filtered_by_stage(self, api_client):
        """GET /api/campaigns/{id}/contacts?stage=new filters by pipeline stage"""
        response = api_client.get(f"{BASE_URL}/api/campaigns/{TEST_EXISTING_CAMPAIGN_ID}/contacts?stage=new")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "contacts" in data
        
        # All contacts should have pipeline_stage=new
        for contact in data["contacts"]:
            assert contact.get("pipeline_stage") == "new", f"Contact stage should be 'new'"
        
        print(f"PASS: GET /api/campaigns/{TEST_EXISTING_CAMPAIGN_ID}/contacts?stage=new returned {data['total']} new contacts")
    
    def test_import_contacts_from_directory(self, api_client):
        """POST /api/campaigns/{id}/contacts imports contacts from directory_listings"""
        # Create a test campaign for import testing
        create_response = api_client.post(f"{BASE_URL}/api/campaigns", json={
            "name": f"TEST_ImportContacts_{uuid.uuid4().hex[:8]}",
            "description": "Test campaign for contact import"
        })
        assert create_response.status_code == 200
        test_campaign_id = create_response.json()["campaign"]["id"]
        
        # Import contacts from directory with filter
        import_payload = {
            "action": "import_from_directory",
            "filter": {
                "city": "Tampa",
                "is_claimed": False
            }
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/campaigns/{test_campaign_id}/contacts",
            json=import_payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should have success=true"
        assert "added" in data, "Response should have 'added' count"
        assert "total" in data, "Response should have 'total' count"
        
        print(f"PASS: POST /api/campaigns/{test_campaign_id}/contacts imported {data['added']} contacts (total: {data['total']})")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/campaigns/{test_campaign_id}")
    
    def test_add_manual_contacts(self, api_client):
        """POST /api/campaigns/{id}/contacts adds manual contacts"""
        # Create a test campaign
        create_response = api_client.post(f"{BASE_URL}/api/campaigns", json={
            "name": f"TEST_ManualContacts_{uuid.uuid4().hex[:8]}",
            "description": "Test campaign for manual contact add"
        })
        assert create_response.status_code == 200
        test_campaign_id = create_response.json()["campaign"]["id"]
        
        # Add manual contacts
        manual_contacts = {
            "contacts": [
                {"email": "test1@example.com", "business_name": "Test Business 1"},
                {"email": "test2@example.com", "business_name": "Test Business 2"}
            ]
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/campaigns/{test_campaign_id}/contacts",
            json=manual_contacts
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("added") == 2, "Should add 2 contacts"
        
        print(f"PASS: POST /api/campaigns/{test_campaign_id}/contacts added {data['added']} manual contacts")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/campaigns/{test_campaign_id}")
    
    def test_update_contact_pipeline_stage(self, api_client):
        """PATCH /api/campaigns/{id}/contacts updates contact pipeline stage"""
        # First get a contact from existing campaign
        get_response = api_client.get(f"{BASE_URL}/api/campaigns/{TEST_EXISTING_CAMPAIGN_ID}/contacts")
        contacts = get_response.json().get("contacts", [])
        
        if len(contacts) == 0:
            pytest.skip("No contacts to update in test campaign")
        
        test_email = contacts[0]["email"]
        original_stage = contacts[0].get("pipeline_stage", "new")
        
        # Update pipeline stage
        new_stage = "contacted" if original_stage == "new" else "new"
        response = api_client.patch(
            f"{BASE_URL}/api/campaigns/{TEST_EXISTING_CAMPAIGN_ID}/contacts",
            json={
                "email": test_email,
                "pipeline_stage": new_stage
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should have success=true"
        
        # Verify update persisted
        verify_response = api_client.get(f"{BASE_URL}/api/campaigns/{TEST_EXISTING_CAMPAIGN_ID}/contacts?stage={new_stage}")
        updated_contacts = verify_response.json().get("contacts", [])
        
        updated_contact = next((c for c in updated_contacts if c["email"] == test_email), None)
        assert updated_contact is not None, f"Contact {test_email} should be in {new_stage} stage"
        
        print(f"PASS: PATCH /api/campaigns/{TEST_EXISTING_CAMPAIGN_ID}/contacts updated {test_email} to '{new_stage}'")
        
        # Reset to original stage
        api_client.patch(
            f"{BASE_URL}/api/campaigns/{TEST_EXISTING_CAMPAIGN_ID}/contacts",
            json={"email": test_email, "pipeline_stage": original_stage}
        )


class TestCampaignValidation:
    """Test validation and error handling for campaigns API"""
    
    def test_create_campaign_without_name_returns_400(self, api_client):
        """POST /api/campaigns without name returns 400"""
        response = api_client.post(f"{BASE_URL}/api/campaigns", json={
            "description": "Campaign without name"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "error" in data, "Response should have error message"
        
        print(f"PASS: POST /api/campaigns without name returned 400: {data['error']}")
    
    def test_get_nonexistent_campaign_returns_404(self, api_client):
        """GET /api/campaigns/{invalid_id} returns 404 or error"""
        fake_id = str(uuid.uuid4())
        response = api_client.get(f"{BASE_URL}/api/campaigns/{fake_id}")
        
        # Should return 404 or 500 with error
        assert response.status_code in [404, 500], f"Expected 404/500, got {response.status_code}"
        
        data = response.json()
        assert "error" in data, "Response should have error message"
        
        print(f"PASS: GET /api/campaigns/{fake_id} returned error: {data['error']}")
    
    def test_update_contact_without_email_returns_400(self, api_client):
        """PATCH /api/campaigns/{id}/contacts without email returns 400"""
        response = api_client.patch(
            f"{BASE_URL}/api/campaigns/{TEST_EXISTING_CAMPAIGN_ID}/contacts",
            json={"pipeline_stage": "contacted"}  # No email
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "error" in data
        
        print(f"PASS: PATCH /api/campaigns/{TEST_EXISTING_CAMPAIGN_ID}/contacts without email returned 400")


class TestUnifiedCalendarAPI:
    """Test GET/POST/PATCH/DELETE /api/calendar/unified"""
    
    def test_get_unified_calendar_events(self, api_client):
        """GET /api/calendar/unified returns events from multiple sources"""
        response = api_client.get(f"{BASE_URL}/api/calendar/unified")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "events" in data, "Response should have 'events'"
        assert "total" in data, "Response should have 'total'"
        assert "colors" in data, "Response should have 'colors' mapping"
        assert "icons" in data, "Response should have 'icons' mapping"
        
        events = data["events"]
        assert isinstance(events, list), "events should be a list"
        
        # Verify color mapping
        colors = data["colors"]
        assert "booking" in colors, "colors should have 'booking'"
        assert "campaign_email" in colors, "colors should have 'campaign_email'"
        assert "content" in colors, "colors should have 'content'"
        
        # Check event sources if events exist
        if len(events) > 0:
            sources = set(e["source"] for e in events)
            print(f"PASS: GET /api/calendar/unified returned {data['total']} events from sources: {sources}")
        else:
            print(f"PASS: GET /api/calendar/unified returned 0 events (no scheduled items)")
    
    def test_get_calendar_events_with_date_filter(self, api_client):
        """GET /api/calendar/unified with date range filter"""
        start_date = "2024-01-01"
        end_date = "2026-12-31"
        
        response = api_client.get(
            f"{BASE_URL}/api/calendar/unified?startDate={start_date}&endDate={end_date}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "events" in data
        
        print(f"PASS: GET /api/calendar/unified with date filter returned {data['total']} events")
    
    def test_get_calendar_events_by_type(self, api_client):
        """GET /api/calendar/unified?type=booking filters by event type"""
        response = api_client.get(f"{BASE_URL}/api/calendar/unified?type=booking")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "events" in data
        
        # All events should be bookings
        for event in data["events"]:
            assert event["event_type"] == "booking", f"Event type should be 'booking', got '{event['event_type']}'"
        
        print(f"PASS: GET /api/calendar/unified?type=booking returned {data['total']} booking events")
    
    def test_create_calendar_event(self, api_client):
        """POST /api/calendar/unified creates a new event"""
        # Schedule for tomorrow to avoid past date validation
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT10:00:00Z")
        
        # NOTE: content_type must be a valid value (photo, product, blog, newsletter)
        # The API default 'custom' is not in the database check constraint
        event_payload = {
            "title": f"TEST_CalendarEvent_{uuid.uuid4().hex[:8]}",
            "description": "Test calendar event from automated testing",
            "event_type": "content",
            "content_type": "photo",  # Must be valid: photo, product, blog, newsletter
            "scheduled_date": tomorrow,
            "status": "draft"
        }
        
        response = api_client.post(f"{BASE_URL}/api/calendar/unified", json=event_payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should have success=true"
        assert "event" in data, "Response should have 'event'"
        
        event = data["event"]
        assert event["title"] == event_payload["title"], "Event title should match"
        assert "id" in event, "Event should have ID"
        
        # Store for cleanup
        self.__class__.created_event_id = event["id"]
        print(f"PASS: POST /api/calendar/unified created event with ID: {event['id']}")
    
    def test_create_calendar_event_past_date_returns_400(self, api_client):
        """POST /api/calendar/unified with past date returns 400"""
        past_date = "2020-01-01T10:00:00Z"
        
        response = api_client.post(f"{BASE_URL}/api/calendar/unified", json={
            "title": "Past Event",
            "scheduled_date": past_date
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "error" in data
        assert "past" in data["error"].lower(), "Error should mention past date"
        
        print(f"PASS: POST /api/calendar/unified with past date returned 400: {data['error']}")
    
    def test_update_calendar_event(self, api_client):
        """PATCH /api/calendar/unified updates an event"""
        event_id = getattr(self.__class__, 'created_event_id', None)
        
        if not event_id:
            # Create an event first
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT10:00:00Z")
            create_response = api_client.post(f"{BASE_URL}/api/calendar/unified", json={
                "title": f"TEST_ToUpdate_{uuid.uuid4().hex[:8]}",
                "scheduled_date": tomorrow,
                "content_type": "photo"  # Must use valid content_type
            })
            if create_response.status_code == 200:
                event_id = create_response.json()["event"]["id"]
            else:
                pytest.skip("Could not create event for update test")
        
        new_title = f"TEST_Updated_{uuid.uuid4().hex[:8]}"
        response = api_client.patch(f"{BASE_URL}/api/calendar/unified", json={
            "id": event_id,
            "source": "scheduled_content",  # Events are stored in scheduled_content table
            "title": new_title,
            "status": "scheduled"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should have success=true"
        
        print(f"PASS: PATCH /api/calendar/unified updated event {event_id}")
    
    def test_delete_calendar_event(self, api_client):
        """DELETE /api/calendar/unified deletes an event"""
        # Create a specific event for deletion
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT10:00:00Z")
        create_response = api_client.post(f"{BASE_URL}/api/calendar/unified", json={
            "title": f"TEST_ToDelete_{uuid.uuid4().hex[:8]}",
            "scheduled_date": tomorrow,
            "content_type": "photo"  # Must use valid content_type
        })
        
        assert create_response.status_code == 200, f"Could not create event for delete test: {create_response.text}"
        delete_event_id = create_response.json()["event"]["id"]
        
        # Delete the event
        response = api_client.delete(
            f"{BASE_URL}/api/calendar/unified?id={delete_event_id}&source=scheduled_content"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should have success=true"
        
        print(f"PASS: DELETE /api/calendar/unified deleted event {delete_event_id}")
    
    def test_update_event_without_id_returns_400(self, api_client):
        """PATCH /api/calendar/unified without ID returns 400"""
        response = api_client.patch(f"{BASE_URL}/api/calendar/unified", json={
            "title": "No ID Event"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "error" in data
        
        print(f"PASS: PATCH /api/calendar/unified without ID returned 400")
    
    def test_delete_event_without_id_returns_400(self, api_client):
        """DELETE /api/calendar/unified without ID returns 400"""
        response = api_client.delete(f"{BASE_URL}/api/calendar/unified")
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "error" in data
        
        print(f"PASS: DELETE /api/calendar/unified without ID returned 400")
    
    def test_create_event_without_required_fields_returns_400(self, api_client):
        """POST /api/calendar/unified without required fields returns 400"""
        response = api_client.post(f"{BASE_URL}/api/calendar/unified", json={
            "description": "Event without title or date"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "error" in data
        
        print(f"PASS: POST /api/calendar/unified without required fields returned 400")


class TestCleanup:
    """Cleanup test data after all tests"""
    
    def test_cleanup_test_campaigns(self, api_client):
        """Delete all TEST_ prefixed campaigns"""
        # Get all campaigns
        response = api_client.get(f"{BASE_URL}/api/campaigns?limit=100")
        
        if response.status_code != 200:
            pytest.skip("Could not fetch campaigns for cleanup")
        
        campaigns = response.json().get("campaigns", [])
        deleted_count = 0
        
        for campaign in campaigns:
            if campaign.get("name", "").startswith("TEST_"):
                delete_response = api_client.delete(f"{BASE_URL}/api/campaigns/{campaign['id']}")
                if delete_response.status_code == 200:
                    deleted_count += 1
        
        print(f"CLEANUP: Deleted {deleted_count} TEST_ prefixed campaigns")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
