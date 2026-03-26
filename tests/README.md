# Tests

This directory contains tests for the Surveyor Inspection application.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Test Coverage

### Components
- **Button** - Button variants, sizes, disabled state, click handling
- **Input** - Value binding, onChange, disabled state, placeholder, types

### Pages
- **Login Page** - Form rendering, error display, form submission

### Utilities
- **cn()** - Class name merging utility
- **Property Types** - Type definitions
- **Inspection Types** - Type definitions
- **User Roles** - Role definitions

### Features
- **Comparables** - Distance calculation (Haversine formula), CSV export, property filtering
- **Export** - CSV generation, currency formatting, null value handling