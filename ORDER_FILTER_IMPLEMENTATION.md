# Order Filtering Implementation

## Overview
This document describes the implementation of date-based filtering for orders in the admin panel. The feature allows filtering orders by:
- **Specific Date**: Select a calendar date to view orders from that day
- **Week**: Select a specific week number and year
- **Month**: Select a specific month and year
- **Year**: Select a specific year

## Backend Implementation

### API Endpoint
**Route**: `GET /api/admin/orders/filter`

**Query Parameters**:
- `filterType`: The type of filter (`date`, `week`, `month`, `year`)
- `date`: ISO date string (required when filterType is `date`)
- `week`: Week number 1-52 (required when filterType is `week`)
- `month`: Month number 1-12 (required when filterType is `month`)
- `year`: Four-digit year (required for week, month, and year filters)

**Response**:
```json
{
  "success": true,
  "orders": [...],
  "count": 10,
  "filter": {
    "filterType": "month",
    "month": "10",
    "year": "2025"
  }
}
```

### File Changes

#### backend/server.js
Added new route at line 432:
```javascript
app.get('/api/admin/orders/filter', async (req, res) => {
  // Filter logic implementation
})
```

The route handles:
- Date range calculations for each filter type
- MongoDB queries with date filters
- Population of user data
- Sorting by creation date (descending)

#### backend/routes/admin.js
Added similar route for modular routing (if using Express Router pattern):
```javascript
router.get("/orders/filter", async (req, res) => {
  // Same filter logic
})
```

## Frontend Implementation

### Component Updates

#### src/pages/Admin/Orders.jsx

**New State Variables** (lines 9-15):
```javascript
const [filterType, setFilterType] = useState('all');
const [selectedDate, setSelectedDate] = useState('');
const [selectedWeek, setSelectedWeek] = useState('');
const [selectedMonth, setSelectedMonth] = useState('');
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
const [totalOrders, setTotalOrders] = useState(0);
```

**Updated fetchOrders Function** (lines 21-78):
- Automatically triggers when filter state changes
- Builds dynamic URL with query parameters
- Handles different filter types
- Updates order count

**New Helper Functions** (lines 274-307):
- `handleFilterTypeChange()`: Resets specific filters when changing filter type
- `clearFilters()`: Resets all filters to default
- `generateYearOptions()`: Creates year dropdown options (current year - 5 years)
- `generateWeekOptions()`: Creates week dropdown options (1-52)

**New UI Section** (lines 315-492):
Complete filter control panel with:
- Filter type selector
- Conditional inputs based on selected filter type
- Clear filters button
- Order count display

## Usage

### For Users
1. Navigate to Admin Panel > Orders
2. Select filter type from dropdown:
   - **All Orders**: Shows all orders (default)
   - **Specific Date**: Pick a date from calendar
   - **Week**: Select week number and year
   - **Month**: Select month name and year
   - **Year**: Select year
3. Orders will automatically refresh based on filter
4. Click "Clear Filters" to reset to all orders

### For Developers

**Testing the API Directly**:
```bash
# Filter by specific date
GET http://localhost:5000/api/admin/orders/filter?filterType=date&date=2025-10-22

# Filter by week
GET http://localhost:5000/api/admin/orders/filter?filterType=week&week=42&year=2025

# Filter by month
GET http://localhost:5000/api/admin/orders/filter?filterType=month&month=10&year=2025

# Filter by year
GET http://localhost:5000/api/admin/orders/filter?filterType=year&year=2025
```

**Extending the Feature**:
To add more filter types:
1. Add new case in backend switch statement
2. Add new option in frontend filter dropdown
3. Add corresponding input controls
4. Update URL building logic in fetchOrders

## Technical Details

### Date Calculations

**Week Calculation**:
- Uses ISO week calculation
- Week starts on Sunday
- Calculates based on days from start of year

**Month Calculation**:
- JavaScript months are 0-indexed internally
- API accepts 1-12 for user convenience
- Converts to 0-11 for Date object

**Time Ranges**:
- All date ranges include full days (00:00:00 to 23:59:59)
- Week ranges span Sunday to Saturday
- Month ranges handle variable days correctly
- Year ranges span January 1 to December 31

### Performance Considerations

1. **Database Indexing**: Ensure `createdAt` field is indexed for fast queries
2. **Population**: Only populates necessary user fields
3. **Limit Results**: Consider adding pagination for large datasets
4. **Caching**: Future enhancement could cache common filter results

### Error Handling

- Backend validates filter parameters
- Frontend validates date inputs
- Graceful fallback to current date/year if invalid
- Empty state message if no orders match filter

## Future Enhancements

1. **Date Range Picker**: Allow custom start and end dates
2. **Quick Filters**: Add buttons for "Today", "This Week", "This Month"
3. **Export Filtered Data**: Download filtered orders as CSV/Excel
4. **Save Filters**: Remember user's last filter selection
5. **Multi-Filter**: Combine date filters with status, payment, etc.
6. **Analytics View**: Show statistics for filtered order set

## Testing Checklist

- [x] Backend route responds correctly
- [x] All filter types work (date, week, month, year)
- [x] UI updates when filter changes
- [x] Clear filters resets to all orders
- [x] Order count updates correctly
- [ ] Test with empty database
- [ ] Test with large dataset (performance)
- [ ] Test edge cases (leap year, week 53, etc.)
- [ ] Mobile responsive layout
- [ ] Accessibility (keyboard navigation, screen readers)

## Known Issues

None currently. Report issues to the development team.

## Version History

- **v1.0** (2025-10-22): Initial implementation with date, week, month, year filters
