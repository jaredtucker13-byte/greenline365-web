import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock react-markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import ChatWidget from '@/app/components/ChatWidget';

describe('ChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it('renders the floating chat button', () => {
    render(<ChatWidget />);
    const button = screen.getByLabelText('Open assistant');
    expect(button).toBeInTheDocument();
  });

  it('opens chat window when button is clicked', () => {
    render(<ChatWidget />);
    const button = screen.getByLabelText('Open assistant');
    fireEvent.click(button);

    // Should show the chat header
    expect(screen.getByText('GreenLine Concierge')).toBeInTheDocument();
    expect(screen.getByText('How may I assist you?')).toBeInTheDocument();
  });

  it('shows welcome message with quick actions when opened', () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText('Open assistant'));

    // Quick actions should be visible
    expect(screen.getByText('Find a business near me')).toBeInTheDocument();
    expect(screen.getByText('Best restaurants in Tampa')).toBeInTheDocument();
  });

  it('renders in embedded mode without floating button', () => {
    render(<ChatWidget embedded />);
    expect(screen.queryByLabelText('Open assistant')).not.toBeInTheDocument();
    // Should show content directly
    expect(screen.getByText('GreenLine Concierge')).toBeInTheDocument();
  });

  it('allows typing in the textarea', () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText('Open assistant'));

    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'Hello there' } });
    expect(textarea).toHaveValue('Hello there');
  });

  it('sends message on Enter key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Hi! How can I help?' }),
    });

    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText('Open assistant'));

    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    // User message should appear
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('does not send on Shift+Enter (allows newline)', () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText('Open assistant'));

    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'line1' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    // Should NOT have sent (no loading indicator)
    expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();
  });

  it('disables send button when input is empty', () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText('Open assistant'));

    // Find the send button (last button in the input area)
    const buttons = screen.getAllByRole('button');
    const sendButton = buttons[buttons.length - 1];
    expect(sendButton).toBeDisabled();
  });

  it('clears conversation when clear button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Hello!' }),
    });

    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText('Open assistant'));

    // Send a message to create conversation
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'Hi' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Clear conversation')).toBeInTheDocument();
    });

    // Clear
    fireEvent.click(screen.getByText('Clear conversation'));

    // Quick actions should reappear (empty state)
    expect(screen.getByText('Find a business near me')).toBeInTheDocument();
  });

  it('uses forceMode when provided', () => {
    render(<ChatWidget forceMode="creative" />);
    fireEvent.click(screen.getByLabelText('Open assistant'));

    expect(screen.getByText('Creative Co-Pilot')).toBeInTheDocument();
    expect(screen.getByText('Your brainstorming partner')).toBeInTheDocument();
  });

  it('shows creative quick actions in creative mode', () => {
    render(<ChatWidget forceMode="creative" />);
    fireEvent.click(screen.getByLabelText('Open assistant'));

    expect(screen.getByText("I'm stuck on a caption")).toBeInTheDocument();
    expect(screen.getByText('Help me brainstorm content')).toBeInTheDocument();
  });

  it('persists hasInteracted to localStorage after first click', () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText('Open assistant'));

    expect(localStorage.getItem('gl365_chat_interacted')).toBe('true');
  });
});
