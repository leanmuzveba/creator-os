<h1>Project Definition </h1>
<h2>Creator OS</h2>

AI-powered social media management and content intelligence platform.
Problem statement

Lean currently manages her content across multiple social-media platforms, including TikTok, Instagram, YouTube and Facebook. Each platform has its own user interface, analytics dashboard, publishing workflow, scheduling functionality, and content-management process.

This creates several problems:

<ul>
  <li>Content must be uploaded repeatedly to different platforms.</li>
  <li>Scheduling must be managed separately.</li>
  <li>Analytics are fragmented across different dashboards.</li>
  <li>It is difficult to compare performance across platforms.</li>
  <li>Content ideas are generated separately from performance data.</li>
  <li>Identifying relevant trends requires manually searching multiple platforms.</li>
  <li>There is no single workspace for managing ideas, scripts, videos, publishing, and analytics.</li>
  <li>Switching between 4–5 different applications increases the time and effort required to manage the creator workflow.</li>
</ul>





##PRELIMINARY INVESTIGATION
Existing System 
              
The current workflow involves using multiple independent platforms. I have to edit my videos in capcut and export, then 
-- Tiktok Studio - look for a sound, paste caption and hashtags, schedule and upload, check analytics dashboard and trending videos
-- Instagram and Facebook - It uploads all at once but the same flow as Tiktok Studio
-- Youtube - same flow as Tiktok Studio

Proposed system

                    LEAN CREATOR OS
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
    ANALYTICS          CONTENT AI          PUBLISHING
        │                  │                  │
        ↓                  ↓                  ↓
 TikTok/Instagram     Ideas & Hooks       TikTok
 YouTube/Facebook     Scripts              Instagram
                     Shot Lists             YouTube
                     Editing Tips            Facebook
                     
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ↓
                    CREATOR DASHBOARD


##PRELIMINARY INVESTIGATION FINDINGS

| Problem                     | Impact                                   |
| --------------------------- | ---------------------------------------- |
| Multiple social platforms   | Increased management time                |
| Different UIs               | Increased learning/friction              |
| Separate analytics          | Difficult to compare performance         |
| Repeated uploading          | Inefficient workflow                     |
| Separate scheduling         | Higher chance of missed posts            |
| No central content database | Ideas can become scattered               |
| Manual trend research       | Time-consuming                           |
| Generic AI content ideas    | Ideas may not reflect actual performance |
| No unified content calendar | Difficult to plan campaigns              |
| No central video library    | Difficult to track content lifecycle     |

##SCOPE DEFINITION 
---------------------A. User Management---------------------------------------------------------

The system will allow the creator to:

Create an account
Log in
Manage their profile
Connect social-media accounts
Disconnect social-media accounts
Manage application permissions
-----------------------B. Social Account Integration----------------------------------------------------

Initial target platforms:

TikTok
Instagram
YouTube
Facebook

The system will store authorised social accounts and retrieve permitted information through official APIs.
For example, YouTube provides APIs for video management and analytics, including retrieving channel/video analytics and uploading videos.
TikTok also provides an official Content Posting API supporting direct posting/upload workflows, post-status tracking and creator information.

--------------------------------C. Analytics Dashboard------------------------------------
The system will display:

Views
Likes
Comments
Shares
Followers/subscribers gained
Engagement rate
Posting frequency
Video performance
Platform comparison
Top-performing content
Performance by content category

Where the platform API makes the metric available.

--------------------------------D. Content Management------------------------------------------------------

Users can create:

Content ideas
Scripts
Hooks
Shot lists
Captions
Editing notes

E. AI Content Assistant

The AI assistant will generate:

Video idea
Visual hook
Written hook
Voiceover
On-screen text
Shot list
Editing recommendations
CTA

The generation will be based on Lean's five content pillars:

Tech Education
Breaking Into Tech
Free Tech Resources
Student & Academic Life
Microsoft Journey

--------------------------F. Trend Explorer-------------------------------------------------------

The system will allow trend discovery using filters such as:

Platform
Category
Topic
Region
Date range
Video format
Keyword

The AI will then provide:

Trend summary → Why it works → Hook analysis → How Lean could adapt it
One important requirement here is that we cannot assume every platform will provide unrestricted access to all trending/public video data. YouTube, for example, provides a mostPopular video chart through its API, while TikTok's developer ecosystem has different products and access restrictions.
Therefore, the final trend engine will be designed around officially available data sources and platform terms, rather than scraping platforms indiscriminately.

---------------------------G. Content Calendar--------------------------------------------

The creator will be able to:

View scheduled posts
Create posts
Edit posts
Reschedule posts
Delete scheduled posts
Filter by platform
Filter by category
View publishing status
H. Multi-platform Publishing

The creator will be able to select:
TikTok, Instagram, YouTube, Facebook and prepare one piece of content for multiple platforms.

However, the system should not assume that "one upload" means identical metadata or identical publishing behaviour everywhere. Each platform may require platform-specific metadata, permissions, processing and publishing flows. TikTok, for example, requires the application to query creator information and respect the creator's available privacy options.

##7. Constraints
Technical Constraints
API limitations
The application depends heavily on third-party APIs.
If a platform does not expose a particular metric or publishing function, the application cannot simply manufacture it.
Authentication
The application will use OAuth-based authorisation rather than collecting users' social-media passwords.
Rate limits
API requests may be subject to rate limits.
TikTok's Content Posting API, for example, specifies access-token request limits and publishing restrictions.

Platform approval
Some platform capabilities may require application review/auditing before public publishing is permitted. For example, YouTube restricts videos uploaded through certain unverified API projects to private visibility until the API project passes the relevant audit.


9. Non-Functional Requirements
These are just as important.
Performance
Dashboard data should load within an acceptable period under normal network conditions.
Security
OAuth authentication
Encrypted credentials/tokens
HTTPS
Secure session management
No storage of social-media passwords
Proper access controls
Availability

The application should remain available even if one social-media API temporarily becomes unavailable.
Scalability- The architecture should allow additional platforms to be added later.
Maintainability- Platform integrations should be modular.

For example:
/social/youtube /tiktok/instagram/facebook
rather than mixing all platform-specific code together.

Usability
The interface should minimise the number of steps required to:
Upload → customise → schedule → publish


# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a14c80eb-1182-4db7-a5a8-621e00855895

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
