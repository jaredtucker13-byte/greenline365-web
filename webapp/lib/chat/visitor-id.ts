export function getOrCreateVisitorId(): string {
  const existingId = document.cookie
   .split('; ')
   .find(row => row.startsWith('gl365_visitor='))
   ?.split('=')[1] 

  if (existingId) {
    return existingId;
  }

  const newId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
  document.cookie = `gl365_visitor=${newId}; max-age=31536000; path=/; SameSite=Lax`;
  
  return newId;
}
