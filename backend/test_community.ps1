# Community Feature Test Script
# Tests all authentication and community endpoints

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Testing NSE Community API Endpoints" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8000"

# Test 1: Register a new user
Write-Host "Test 1: Registering new user..." -ForegroundColor Yellow
$registerBody = @{
    username = "testtrader$(Get-Random -Minimum 1000 -Maximum 9999)"
    email = "test$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
    password = "password123"
    full_name = "Test Trader"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    $token = $registerResponse.access_token
    $username = $registerResponse.user.username
    Write-Host "✓ User registered successfully: $username" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Registration failed: $_" -ForegroundColor Red
    exit
}

# Test 2: Get current user profile
Write-Host "`nTest 2: Getting user profile..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    $meResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers $headers
    Write-Host "✓ Profile retrieved: $($meResponse.username) (Rep: $($meResponse.reputation))" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get profile: $_" -ForegroundColor Red
}

# Test 3: Create a post
Write-Host "`nTest 3: Creating a post..." -ForegroundColor Yellow
$postBody = @{
    title = "My first stock analysis - RELIANCE looks bullish!"
    content = "After analyzing the technical indicators and recent news, I believe RELIANCE is positioned for a strong upward movement. The RSI is showing oversold conditions and there's strong support at ₹2400. What do you all think?"
    symbol = "RELIANCE"
} | ConvertTo-Json

try {
    $postResponse = Invoke-RestMethod -Uri "$baseUrl/api/community/posts" -Method Post -Body $postBody -ContentType "application/json" -Headers $headers
    $postId = $postResponse.id
    Write-Host "✓ Post created successfully! ID: $postId" -ForegroundColor Green
    Write-Host "  Title: $($postResponse.title)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to create post: $_" -ForegroundColor Red
}

# Test 4: Get community feed
Write-Host "`nTest 4: Fetching community feed..." -ForegroundColor Yellow
try {
    $feedResponse = Invoke-RestMethod -Uri "$baseUrl/api/community/feed?page=1&limit=10&sort=new" -Method Get
    Write-Host "✓ Feed retrieved: $($feedResponse.total) total posts, $($feedResponse.posts.Count) in this page" -ForegroundColor Green
    if ($feedResponse.posts.Count -gt 0) {
        Write-Host "  Latest post: $($feedResponse.posts[0].title)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to get feed: $_" -ForegroundColor Red
}

# Test 5: Vote on post
Write-Host "`nTest 5: Upvoting the post..." -ForegroundColor Yellow
$voteBody = @{
    vote_type = 1
} | ConvertTo-Json

try {
    $voteResponse = Invoke-RestMethod -Uri "$baseUrl/api/community/posts/$postId/vote" -Method Post -Body $voteBody -ContentType "application/json" -Headers $headers
    Write-Host "✓ Vote recorded! Upvotes: $($voteResponse.upvotes), Downvotes: $($voteResponse.downvotes)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to vote: $_" -ForegroundColor Red
}

# Test 6: Add a comment
Write-Host "`nTest 6: Adding a comment..." -ForegroundColor Yellow
$commentBody = @{
    content = "Great analysis! I agree with your view on RELIANCE. The fundamentals also look strong with their new energy business."
    post_id = $postId
} | ConvertTo-Json

try {
    $commentResponse = Invoke-RestMethod -Uri "$baseUrl/api/community/comments" -Method Post -Body $commentBody -ContentType "application/json" -Headers $headers
    $commentId = $commentResponse.id
    Write-Host "✓ Comment added successfully! ID: $commentId" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add comment: $_" -ForegroundColor Red
}

# Test 7: Get comments for post
Write-Host "`nTest 7: Fetching post comments..." -ForegroundColor Yellow
try {
    $commentsResponse = Invoke-RestMethod -Uri "$baseUrl/api/community/posts/$postId/comments" -Method Get
    Write-Host "✓ Comments retrieved: $($commentsResponse.Count) comments" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get comments: $_" -ForegroundColor Red
}

# Test 8: Get user profile
Write-Host "`nTest 8: Fetching user profile..." -ForegroundColor Yellow
try {
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/api/community/users/$username" -Method Get
    Write-Host "✓ Profile retrieved:" -ForegroundColor Green
    Write-Host "  Username: $($profileResponse.username)" -ForegroundColor Gray
    Write-Host "  Reputation: $($profileResponse.reputation)" -ForegroundColor Gray
    Write-Host "  Posts: $($profileResponse.post_count)" -ForegroundColor Gray
    Write-Host "  Comments: $($profileResponse.comment_count)" -ForegroundColor Gray
    Write-Host "  Total Upvotes: $($profileResponse.total_upvotes)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to get user profile: $_" -ForegroundColor Red
}

# Test 9: Create another post for testing
Write-Host "`nTest 9: Creating another test post..." -ForegroundColor Yellow
$post2Body = @{
    title = "TCS Q3 results exceeded expectations!"
    content = "TCS reported strong Q3 results with 15% YoY growth. The management commentary was very positive about the deal pipeline. This could be a good entry point for long-term investors."
    symbol = "TCS"
} | ConvertTo-Json

try {
    $post2Response = Invoke-RestMethod -Uri "$baseUrl/api/community/posts" -Method Post -Body $post2Body -ContentType "application/json" -Headers $headers
    Write-Host "✓ Second post created! ID: $($post2Response.id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create second post: $_" -ForegroundColor Red
}

# Test 10: Test filtering by symbol
Write-Host "`nTest 10: Filtering feed by symbol (RELIANCE)..." -ForegroundColor Yellow
try {
    $filteredFeedResponse = Invoke-RestMethod -Uri "$baseUrl/api/community/feed?symbol=RELIANCE&sort=hot" -Method Get
    Write-Host "✓ Filtered feed retrieved: $($filteredFeedResponse.posts.Count) RELIANCE posts" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to filter feed: $_" -ForegroundColor Red
}

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "All tests completed!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "`nYour test account:" -ForegroundColor Yellow
Write-Host "  Username: $username" -ForegroundColor White
Write-Host "  Token: $token" -ForegroundColor Gray
Write-Host "`nYou can now:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:3001 in your browser" -ForegroundColor White
Write-Host "  2. Click 'Login' and use the credentials above" -ForegroundColor White
Write-Host "  3. Navigate to the Community tab" -ForegroundColor White
Write-Host "  4. Create posts, comment, and vote!" -ForegroundColor White
