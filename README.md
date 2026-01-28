# AromaVerse - Fragrance Review Platform

A student project for exploring and reviewing fragrances. Built with PHP backend and JavaScript frontend.

## Project Structure

```
projekt/
├── backend/           # PHP REST API
│   ├── rest/
│   │   ├── dao/       # Data Access Objects
│   │   ├── routes/    # API route definitions
│   │   └── services/  # Business logic
│   └── index.php      # API entry point
├── frontend/          # Single Page Application
│   ├── assets/        # CSS, JS, images
│   ├── services/      # Frontend services
│   ├── tpl/           # HTML templates
│   └── utils/         # Utility functions
└── README.md          # This file
```

## Features

- User authentication (JWT-based)
- Fragrance catalog browsing
- Review system
- User profiles with image upload
- Admin panel for content management
- Social sharing of reviews
- Fragrance finder based on preferences

## Technology Stack

**Backend:**
- PHP 7.4+
- Flight PHP (micro-framework)
- MySQL/MariaDB
- JWT for authentication

**Frontend:**
- Vanilla JavaScript
- jQuery & jQuery.spapp (SPA routing)
- Bootstrap 5
- Toastr for notifications

## Setup Instructions

### Prerequisites
- XAMPP/WAMP/LAMP or similar
- PHP 7.4 or higher
- MySQL/MariaDB
- Composer

### Installation

1. **Database Setup:**
   ```sql
   -- Import the database
   mysql -u root -p < backend/parfumesDatabaseFinal.sql
   ```

2. **Backend Configuration:**
   - Update `backend/rest/dao/config.php` with your database credentials
   - Run `composer install` in the `backend/` directory

3. **Frontend Configuration:**
   - Update `frontend/utils/constants.js` with your backend URL
   - Ensure web server points to `frontend/` directory

4. **File Permissions:**
   - Ensure `frontend/assets/images/` is writable for image uploads

## Development

### Backend API
- Entry point: `backend/index.php`
- Routes defined in `backend/rest/routes/`
- Services contain business logic in `backend/rest/services/`

### Frontend
- Main entry: `frontend/index.html`
- SPA routing handled by `jQuery.spapp`
- Main application logic in `frontend/assets/js/libraries/custom.js`

## Deployment Notes

For production deployment:

1. **Security:**
   - Change JWT_SECRET in `backend/rest/dao/config.php`
   - Use environment variables for sensitive data
   - Enable HTTPS
   - Configure CORS properly

2. **Database:**
   - Use strong database credentials
   - Enable prepared statements (already implemented)

3. **File Uploads:**
   - Set proper file size limits
   - Validate file types server-side
   - Store uploads outside web root if possible

## License

Student project - for educational purposes.
