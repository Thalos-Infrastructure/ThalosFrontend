# Requirements Document

## Introduction

This document specifies the requirements for completing the Thalos Connect profile editor integration after rebasing the `projectProfile` branch onto main. The system enables users to create and edit their professional profiles through both personal and business dashboards, with support for dual profile types (Builder and Project) and proper backend API integration.

## Glossary

- **Profile_Editor**: The modal UI component that allows users to create and edit their Thalos Connect profile
- **Connect_Profile**: A user profile containing Builder profile data, Project profile data, or both
- **Builder_Profile**: A profile for individuals offering services (freelancers, contractors, developers)
- **Project_Profile**: A profile for organizations seeking services or builders
- **Backend_API**: The Nest.js backend service that persists profile data
- **Profile_Type**: An enumeration of "builder" or "project" indicating which profile sections are active
- **Session_Token**: The JWT authentication token required for API requests
- **Profile_Endpoint**: The backend REST endpoint `/profiles` for PATCH operations and `/profiles/me` for GET operations

## Requirements

### Requirement 1: Profile Editor Component Integration

**User Story:** As a user, I want to open the profile editor from the dashboard, so that I can create or update my Thalos Connect profile.

#### Acceptance Criteria

1. WHEN a user clicks the profile edit button in the personal dashboard, THE Profile_Editor SHALL display as a modal overlay
2. WHEN a user clicks the profile edit button in the business dashboard, THE Profile_Editor SHALL display as a modal overlay
3. WHEN the Profile_Editor is not open, THE Profile_Editor SHALL not be rendered in the DOM
4. WHEN a user clicks outside the Profile_Editor modal, THE Profile_Editor SHALL close without saving changes
5. WHEN a user clicks the close button, THE Profile_Editor SHALL close without saving changes

### Requirement 2: Profile Data Loading

**User Story:** As a user, I want my existing profile data to load when I open the editor, so that I can see and modify my current information.

#### Acceptance Criteria

1. WHEN the Profile_Editor opens and a Session_Token is available, THE Profile_Editor SHALL fetch profile data from the Profile_Endpoint
2. WHEN the GET /profiles/me request succeeds with profile data, THE Profile_Editor SHALL populate all form fields with the returned data
3. WHEN the GET /profiles/me request returns a 404 not found error, THE Profile_Editor SHALL display empty form fields for a new profile
4. WHEN the GET /profiles/me request fails with a non-404 error, THE Profile_Editor SHALL display the error message to the user
5. WHILE the profile data is loading, THE Profile_Editor SHALL display a loading indicator
6. WHEN no Session_Token is available, THE Profile_Editor SHALL display an authentication error message

### Requirement 3: Profile Type Selection

**User Story:** As a user, I want to select whether I'm a Builder, a Project, or both, so that the editor shows me the relevant form sections.

#### Acceptance Criteria

1. THE Profile_Editor SHALL display toggle buttons for "builder" and "project" Profile_Types
2. WHEN a user clicks a Profile_Type toggle button, THE Profile_Editor SHALL add or remove that Profile_Type from the profile_types array
3. WHEN a Profile_Type is selected, THE Profile_Editor SHALL display the corresponding form section (Builder or Project)
4. WHEN a Profile_Type is deselected, THE Profile_Editor SHALL hide the corresponding form section
5. WHEN both Profile_Types are selected, THE Profile_Editor SHALL display both Builder and Project form sections
6. WHEN no Profile_Types are selected, THE Profile_Editor SHALL display a validation error on save

### Requirement 4: Builder Profile Form Fields

**User Story:** As a builder, I want to enter my professional information, so that projects can discover and hire me.

#### Acceptance Criteria

1. WHEN the "builder" Profile_Type is selected, THE Profile_Editor SHALL display input fields for handle, headline, skills, tech_stack, hourly_rate, availability, bio, portfolio_links, and social_links
2. WHEN a user enters a handle value, THE Profile_Editor SHALL convert it to lowercase and remove invalid characters
3. WHEN a user enters comma-separated skills, THE Profile_Editor SHALL parse them into a string array
4. WHEN a user enters comma-separated tech_stack items, THE Profile_Editor SHALL parse them into a string array
5. WHEN a user enters line-separated portfolio_links, THE Profile_Editor SHALL parse them into a string array
6. WHEN a user enters line-separated social_links, THE Profile_Editor SHALL parse them into a string array
7. WHEN a user enters an hourly_rate, THE Profile_Editor SHALL store it as a number or null if empty
8. WHEN a user clears the hourly_rate field, THE Profile_Editor SHALL store null for hourly_rate

### Requirement 5: Project Profile Form Fields

**User Story:** As a project organization, I want to enter my company information, so that builders can understand who we are and what we need.

#### Acceptance Criteria

1. WHEN the "project" Profile_Type is selected, THE Profile_Editor SHALL display input fields for org_name, org_website, org_description, looking_for, and org_links
2. WHEN a user enters comma-separated looking_for items, THE Profile_Editor SHALL parse them into a string array
3. WHEN a user enters line-separated org_links, THE Profile_Editor SHALL parse them into a string array
4. WHEN a user enters a URL in org_website, THE Profile_Editor SHALL accept valid URL formats

### Requirement 6: Profile Validation

**User Story:** As a system, I want to validate profile data before saving, so that invalid data is not sent to the backend.

#### Acceptance Criteria

1. WHEN a user attempts to save with no Profile_Types selected, THE Profile_Editor SHALL display an error message and prevent save
2. WHEN a user attempts to save a Builder profile with an invalid handle format, THE Profile_Editor SHALL display an error message and prevent save
3. WHEN a Builder handle contains uppercase letters, THE Profile_Editor SHALL convert them to lowercase before validation
4. WHEN a Builder handle contains multiple consecutive hyphens, THE Profile_Editor SHALL display an error message
5. THE Profile_Editor SHALL accept Builder handles matching the pattern: lowercase letters, numbers, and single hyphens only

### Requirement 7: Profile Save Operation

**User Story:** As a user, I want to save my profile changes, so that my information is persisted to the backend.

#### Acceptance Criteria

1. WHEN a user clicks the save button with valid data and a Session_Token, THE Profile_Editor SHALL send a PATCH request to the Profile_Endpoint
2. WHEN the PATCH /profiles request succeeds, THE Profile_Editor SHALL close the modal
3. WHEN the PATCH /profiles request fails, THE Profile_Editor SHALL display the error message and keep the modal open
4. WHILE the save operation is in progress, THE Profile_Editor SHALL disable the save button and display a saving indicator
5. WHEN the PATCH request succeeds, THE Backend_API SHALL return the saved Connect_Profile in the response
6. WHEN no Session_Token is available, THE Profile_Editor SHALL display an error message and prevent save

### Requirement 8: API Response Envelope Handling

**User Story:** As a developer, I want the API client to handle both wrapped and unwrapped profile responses, so that the component works regardless of backend response format.

#### Acceptance Criteria

1. WHEN the GET /profiles/me endpoint returns a profile wrapped in a `{ profile: {...} }` envelope, THE Profile_Editor SHALL extract the inner profile object
2. WHEN the GET /profiles/me endpoint returns a profile object directly, THE Profile_Editor SHALL use it as-is
3. WHEN the PATCH /profiles endpoint returns a profile wrapped in a `{ profile: {...} }` envelope, THE Profile_Editor SHALL extract the inner profile object
4. WHEN the PATCH /profiles endpoint returns a profile object directly, THE Profile_Editor SHALL use it as-is
5. WHEN the API response contains no profile data, THE Profile_Editor SHALL return an error

### Requirement 9: Error Handling

**User Story:** As a user, I want to see clear error messages when something goes wrong, so that I can understand what happened and how to fix it.

#### Acceptance Criteria

1. WHEN an API request fails due to network error, THE Profile_Editor SHALL display "Network error" to the user
2. WHEN an API request fails with a 401 unauthorized error, THE Profile_Editor SHALL display an authentication error message
3. WHEN an API request fails with a 404 not found error on initial load, THE Profile_Editor SHALL treat this as a new profile scenario
4. WHEN an API request fails with a server error, THE Profile_Editor SHALL display the error message from the response
5. WHEN a validation error occurs, THE Profile_Editor SHALL display the validation error message above the form sections
6. IF an error message is displayed, THEN THE Profile_Editor SHALL show an alert icon alongside the error text

### Requirement 10: Integration with Dashboard Pages

**User Story:** As a user accessing either dashboard, I want consistent profile editing functionality, so that my experience is uniform across the application.

#### Acceptance Criteria

1. THE personal dashboard page SHALL import and use the Profile_Editor component
2. THE business dashboard page SHALL import and use the Profile_Editor component
3. WHEN the Profile_Editor is used in the personal dashboard, THE Profile_Editor SHALL use the authenticated user's Session_Token
4. WHEN the Profile_Editor is used in the business dashboard, THE Profile_Editor SHALL use the authenticated user's Session_Token
5. WHEN a profile is successfully saved, THE dashboard SHALL reflect any changes to the user's profile display
