# wifi_monitoring

1. Landing Page / Dashboard
Purpose: Provide a high-level overview of the network's status, focusing on key metrics and quick access to important information.

Layout and Features:

**Header:
Logo/Title: "AP Monitoring System" prominently displayed.
Navigation Menu: Links to "Dashboard," "Sites," and "About" pages.
Main Content Area:
a) Key Metrics Summary:
Total Devices: Displaying the total number of devices (e.g., "Total Devices: 7,000").
Devices Down: Highlighting the current number of down devices (e.g., "Devices Down: 300").
These metrics will be presented using large, easily readable cards or tiles.
b) Network Health Indicator:

A visual element like a progress bar or gauge showing the percentage of devices operational (e.g., "95% Operational").
Color-coded to indicate overall health (green for healthy, yellow for warnings, red for critical).
c) Sites with Issues:

A section listing sites that have down devices.
Presented as a horizontal scrollable list or grid of site cards.
Each card shows:
Site Name: Full name of the site.
Number of Down Devices: e.g., "5 devices down."
Quick Status Indicator: An icon or color bar indicating severity.
d) Recent Alerts:

A list or feed showing devices that have recently gone down.
Includes timestamps and device names.
Allows users to quickly see recent issues.
Footer: -Contact Information, Version Number, or **Legal Notices.
2. Sites Page
Purpose: Provide a detailed overview of each site, focusing on sites with down devices but allowing access to all site information.

Layout and Features:

**Search and Filter Bar:
Allows users to search for sites by name.
Filters to show all sites, only sites with down devices, or sort by the number of down devices.
Sites List/Grid: -Options**:
List View: A vertical list with each row representing a site.
Grid View: A grid of cards for each site.
Site Card/Row Details:
Site Name: Displayed prominently.
Total Devices at Site: e.g., "Devices: 50."
Devices Down: Highlighted if there are any down devices.
Status Indicator:
Visual cue (e.g., colored dot or icon) indicating if the site has issues.
Green for all devices up, red if devices are down.
Interaction: -Clicking on a site** takes the user to the Site Details Page.
3. Site Details Page
Purpose: Provide an in-depth look at a specific site, including all devices and their statuses.

Layout and Features:

**Breadcrumb Navigation: -Allows users to see their navigation path and easily return to previous pages (e.g., "Dashboard > Sites > Site Name").
Site Header:
Site Name: Clearly displayed.
Summary Metrics:
Total Devices at the site.
Devices Down at the site.
Last Updated timestamp.
Device Table:
Columns:
Device Name
Status: "Up" or "Down," possibly with color-coded text or icons.
MAC Address
Location: Specific location within the site if available.
Last Update: Timestamp of the latest status update.
Features: -Sorting: Users can sort by any column.
Filtering: Options to filter devices by status (e.g., show only down devices).
Highlighting Down Devices: Rows for down devices may be highlighted with a red background or icon.

4. Device Details Page (Optional for POC)
Purpose: Show detailed information about a specific device.

Layout and Features:

**Device Header:
Device Name
Status: Current status ("Up" or "Down").
Last Updated: Timestamp.
Device Details Details:
MAC Address
Location: Within the site.
Site Name: Link back to the site details.
Additional Information:
Down Since: For down devices, show when they became down.
Historical Data: (Future Enhancement) Placeholder for future historical performance data.
Action Buttons (Optional):
Report Issue
to report a technical issue.
5. Navigation and Usability
**Consistent Header and Footer: Ensures users can navigate easily throughout the site.
**Responsive Menus: Hamburger menu for mobile views.
Page Layout: -Using Material-UI's Grid System** to create a responsive and clean layout.
6. Visual Design Elements
Color Scheme: -Blues and grays for a professional feel.
Status Colors:
Green: Devices or sites with all devices up.
Red: Devices or sites with down devices.
Yellow/Orange: Warning states (if applicable).
Typography: -Using clear and legible fonts** like Roboto, which is default in Material-UI.
Icons and Graphics: -Using Material Icons** for consistency.
Status Icons: -Check Circle for up, Error for down devices.
Spacing and Dividers: -Adequate whitespace** to prevent clutter.
Dividers between sections for clarity.

those are some of the features I am interested for this webpage, we can start with 