/*!
 PurchaseOrderPrint.js
 
  
  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     10/24/2025

 
 Purpose
   - Prepares the Purchase Order (PO) "Print" view by:
   - Rendering a human-readable "Selected Filters" summary in the form title.
   - Displaying a "Print Date" timestamp.
   - Normalizing visible date fields (removing time).
   - Calculating and appending a "Grand Total" row for PO line totals.
   - Requesting the parent window to invoke print.

 
 KEY CONCEPTS:
    USER PERMISSIONS:
      There is a user permission model in place to restrict which updates a user can make.
      This is separate from LFF security, which can, (but in practice usually does not), limit who 
      can even access a particular form. For our purposes, this is not particularly useful for our needs because we want
      all users to be able to view the forms. What we want instead is to limit their ability to do certain things
      inside the application. 
      There are several user types which are defined in the database users table, (tblUsers) each with their own
      level of permission. They are:
        - Cell Lead (user-type-id == 5). Cell Leads can only view tickets and tasks. They cannot make any changes.
          In fact, cell leads are not logged in to LFF at all because they do no have LFF accounts.
        - Manufacturing Engineer (user-type-id == 4). They do have LFF accounts, but still have read-only access. 
        - Quality Engineers, (QE's) (user-type-id == 3). QE's can add tickets, add tasks to tickets, add notes. 
          They cannot, however, change tickets outside their department.
          They also cannot change task statuses or assign them to anyone.
        - Metrology Calibration (user-type-id == 2). They have permissions to update Service Tickets, but not programming
          tickets. (A service ticket is a non-programming type of ticket used for things like a machine being
          down or needing service.)_
        - Metrology users (user-type-id == 1). They have full permissions to change the status of tasks,
          assign tasks. They can also add tickets, add tasks to tickets, add notes, etc.
      
      There is also a special case Metrology user, the Admin. This is designated in the User's table by the Admin 
      flag being set to 1. Admin's can access forms that are not available to the "regular" Metrology user, such 
      as "Department", or "Task Types". Lookup values which are not likely to change very often, if ever. There are also a 
      few little things here and there that an Admin can do that a regular Metrology user cannot, such as 
      sending off an Assignee Pester Message. (Emailing the Assignee of a task asking what's going on with it.)
      
      Lastly, there is a separate flag in the database called IsActive. If a user is inactivated, they have 
      read-only access to the system, regardless of their former user type.
      
      How authentication is performed: 
        When the user first loads the form, LFF fills in the .lf-user-name field with CRETEX\username. 
        (Predicated on the fact that the user has a LFF account and is logged in to LFF).
        Because of the expense, Cell Leads have not been given LFF accounts, so the .lf-user-name field will be set to "Anonymous User" for them.
        In any case, if the user is logged in to LFF, it sets the .lf-user-name to CRETEX\username, but we only want the username portion 
        so we copy just the username portion (trimming off the "CRETEX/" part) into the .network-user-name field, 
        which is what gets posted back to the server.
        This will be matched against the user database table to determine the user's ID, user type, and department, etc.

   LASERFICHE EVENTS:
      There are two key LaserFiche events used in this script:
          - onloadlookupfinished: The event fires only once, when all the initial lookups have completed. The kinds of lookups that are completed
                                  under this event are the ones that do not have any arguments in them, meaning that they can be looked up immediately.
                                  Examples of this would be Task Types and Task Statuses. These lookups do not depend on any other fields being set.
          - lookupcomplete: This event fires each time a lookup completes after the onloadlookupfinished event has been called. 
                            Laserfiche has lookup rules applied to certain fields, so that when a field is changed, it triggers a lookup to fill in other fields.
                            The fields themselves can either be changed by the user directly, or indirectly. 
                            An example of a direct change would be when the user chooses a Site from the dropdown. 
          
    
      Now this gets a bit tricky because the lookupcomplete event can fire multiple times, and we only want to do certain things once. Therefore, we need
      to put logic in there so that it's not doing expensive things again and again.
      There is a way of asking what the TriggerID of the lookup is. (A laserfiche function). But I found this to be kind of a pain to use because
      you have to know the TriggerID of the lookup that you want to respond to, and it's just an integer. Also, if you ever change anything 
      in the form, you don't know if the trigger id has changed or not. So, I found it easier to just put logic in the function.
      
    
      For an example of what I'm talking about, we're setting the username field in code and causing a lookup, (see 'User Permissions' above).
      Because we're setting the field in code and causing a lookup, the onloadlookupfinished event has already fired. Therefore, any logic that 
      relies on user fields being populated won't work if you call them from the onloadlookupfinished event. Instead, we have to call them from 
      the lookupcomplete event. The unfortunate side effect of this is that the lookupcomplete event can fire multiple times, 
      so we have to put logic in there so that it's not doing expensive things again and again. If you do this wrong, you can seriously lengthen
      the load time of the form. Sometimes this is sort of unavoidable because of the way the LFF Lookup rules work, 
      but you want to minimize it as much as possible.

      Daisy-Chaining Lookups:
        A side effect of the way lookups work is how they sometimes daisy-chain. Let me explain with an example:
        In our example, we have four fields: LFUserName, NetworkUserName, SiteID, DepartmentLookupTable.
        At the beginning the only field which has anything in it is LFUserName, because LF has filled it in for us.
        We take that value, keeping only the username portion and put that in NetworkUserName. 
        This causes a lookup for all the user related fields, including SiteID. Once the SiteID is set, this in turn
        causes another lookup to pull in all the departments related to that site. The Department Lookup cannot be loaded until 
        we know which site we're talking about. Sometimes this daisy-chaining can get 3 and sometimes even 4 levels deep because of all the relationships between
        various fields on a form. This causes the form to be slower than it otherwise would have been, but there's not a lot we can do about it.
        It sort of is what it is. This is what happens when you have to make an application with a non-application framework.
   
   FILTERING :
      There is no way to filter or sort rows in LFF, so I had to build a custom filtering mechanism. This is done via a combination of hidden 
      fields which are arguments to a SQL Server stored procedure, all of which are applied via the query string when the form is loaded. 
      Here is a list of the hidden fields used for filtering:

         - .poid           => purchase order id (integer)
         - .sid            => site id (integer)
         - .fincom         => include (1) or exclude (0) completed POs (integer)
         - .freqid         => requester id (integer)
         - .fvname         => vendor name (string)
         - .fpodesc        => purchase order description (string)
         - .fponum         => purchase order number (string)
         - .fdmin          => create date minimum (date)
         - .fdmax          => create date maximum (date)


 Key Behaviors
 - Hides any elements with the `.Submit` class.
 - Listens for custom application events:
   - `onloadlookupfinished`: finalizes the header and schedules printing.
   - `lookupcomplete`: formats date fields and ensures a grand total row exists.
 - Posts a `"printme"` message to the parent window after a short delay.
 
 Dependencies / Assumptions
 - jQuery is available globally as `$`.
 - moment.js is available globally as `moment` for date formatting.
 - The DOM contains form fields with classes used below (e.g., `.fincom`, `.freqid`, `.fvname`, etc.).
 - Line totals are contained in text inputs within `.line-total-col`, potentially formatted with thousands separators.
 - Cross-window messaging uses a wildcard origin ("*"); restrict this if a specific parent origin is known.

 */

$(function () {
  // Hide submit controls in the print view.
  $('.Submit').hide();

  /**
   * onloadlookupfinished
   * - Sets the form title to show selected filters.
   * - Appends a "Print Date" label.
   * - Triggers a change on the site selector (to refresh any dependent bindings).
   * - Schedules a print request via postMessage to the parent window.
   */
  $(document).on("onloadlookupfinished", function () {
    // Render "Selected Filters" summary at the top of the form.
    $('#cf-formtitle label').text(generateFilterText());

    // Append the print timestamp under the title.
    $('#cf-formtitle label')
      .parent()
      .append('<label style="display:block;font-size:12px;">Print Date: ' + new Date().toLocaleString() + '</label>');

    // Trigger any site-dependent refreshes.
    $('.site-id input').trigger("change");
    
    // Give the DOM time to settle, then request the parent window to print.
    setTimeout(function () {
      parent.postMessage("printme", "*"); // Consider restricting the target origin instead of "*".
    }, 1000);
  });

  /**
   * lookupcomplete
   * - Normalizes date fields to show only the date portion.
   * - Ensures a grand total row is appended once results are available.
   */
  $(document).on('lookupcomplete', function () {
    // Trim time portion from "Create Date" if present.
    if (($('.create-date-col input').val() !== '') && ($('.create-date-col input').val() !== undefined)) {
      $('.create-date-col input').val($('.create-date-col input').val().split(" ")[0]);
    }

    // Trim time portion from "Last Updated" if present.
    if (($('.last-updated-col input').val() !== '') && ($('.last-updated-col input').val() !== undefined)) {
      $('.last-updated-col input').val($('.last-updated-col input').val().split(" ")[0]);
    }

    // Add "Grand Total" row once and only if there are PO rows.
    if (($('.grand-total').length === 0) && ($('.purchase-order-table tbody tr').length > 0)) {
      $('.purchase-order-table tbody').append(generateGrandTotalLine());
    }
  });

});


/**
 * Generates the filter text displayed in the report title area.
 *
 * Reads values from filter fields to build a single-line summary:
 * - Site
 * - Requester
 * - Vendor
 * - Description (wildcarded)
 * - PO Number
 * - Create Date range (>=, <=, or Between)
 * - Status scope (Active Only vs. Active and Completed based on `.fincom`)
 *
 * @returns {string} The generated filter text.
 * @requires moment
 */
function generateFilterText() {
  let filterText = "";
  const fincom = Number($('.fincom input').val()); 
  const freqid = Number($('.freqid input').val());
  const freqname = $('.freqname input').val();
  const fvname = $('.fvname input').val();
  const fpodesc = $('.fpodesc input').val();
  const fponum = $('.fponum input').val();
  const fdmin = $('.fdmin input').val();
  const fdmax = $('.fdmax input').val();

  // Site
  if ($('.site-name input').val() !== '') {
    filterText += "SELECTED FILTERS: Site= '" + $('.site-name input').val() + "'";
  }

  // Requester
  if (!isNaN(freqid) && (freqid > 0)) {
    filterText += ", Requester= '" + freqname + "'";
  }

  // Vendor
  if (fvname !== '') {
    filterText += ", Vendor= '" + fvname + "'";
  }

  // Description (wildcard)
  if (fpodesc !== '') {
    filterText += ", Description= '*" + fpodesc + "*'";
  }

  // PO Number
  if (fponum !== '') {
    filterText += ", PO Number= '" + fponum + "'";
  }

  // Create Date range
  if ((fdmin !== '') && (fdmax === '')) {
    filterText += ", Create Date >=: '" + moment(fdmax).format('MM/DD/YYYY') + "'";
  }

  if ((fdmin === '') && (fdmax !== '')) {
    filterText += ", Create Date <=: '" + moment(fdmax).format('MM/DD/YYYY') + "'";
  }

  if ((fdmin !== '') && (fdmax !== '')) {
    filterText += ", Create Date Between: '" + moment(fdmax).format('MM/DD/YYYY') + "' and '" + moment(fdmax).format('MM/DD/YYYY') + "'";
  }

  // Status scope
  if (!isNaN(fincom) && (fincom > 0)) {
    filterText += ". (Active and Completed.)";
  }
  else {
    filterText += ". (Active Only.)";
  }

  return filterText;
}


/**
 * Builds the HTML table row for the "Grand Total" and calculates the sum.
 *
 * - Iterates over `.line-total-col input[type="text"]` and parses values as numbers.
 * - Ignores non-numeric or empty values.
 * - Returns a single `<tr>` string with formatted currency total.
 *
 * DOM Contract:
 * - Expects a PO table body at `.purchase-order-table tbody`.
 *
 * @returns {string} The HTML string for the "Grand Total" row.
 */
function generateGrandTotalLine() {
  let grandTotal = 0;

  // Sum all visible line item totals (handling thousands separators).
  $('.line-total-col input[type="text"]').each(function () {
    const lineTotal = parseNumberWithCommas($(this).val());
    if (!isNaN(lineTotal)) {
      grandTotal += lineTotal;
    }
  });

  // Format to two decimals and add thousands separators for display.
  grandTotal = grandTotal.toFixed(2);
  let grandTotalDisplay = grandTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Construct a single-row grand total footer.
  return '<tr class="grand-total"><td/><td/><td/><td/><td style="text-align:center;font-weight:bold;font-size:16px;">Grand Total: </td><td style="font-weight:bold;font-size:16px;">$ ' + grandTotalDisplay + '</td><td/><td/><td/><td/></tr>';
}


/**
 * Parses a numeric string that may contain thousands separators (commas).
 *
 * Examples:
 * - "1,234.56" => 1234.56
 * - "  987,654  " => 987654
 * - Non-string values return NaN.
 *
 * @param {string} str The input string to parse.
 * @returns {number} The parsed floating-point number, or NaN if not parseable.
 */
function parseNumberWithCommas(str) {
  if (typeof str !== "string") return NaN; // Validate input type
  const cleaned = str.replace(/,/g, '').trim();
  return parseFloat(cleaned);
}
