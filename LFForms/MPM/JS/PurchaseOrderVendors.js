$(function () {
  // Normalize Network Username based on LF username. Store uppercase simple username portion.
  const lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().slice(lfUserName.lastIndexOf('\\') + 1)).trigger("change");

  // Initial UI setup.
  $('.Submit').hide();

  // Runtime script/styles injection (cookies, confirm dialogs, UI theme, pagination CSS).
  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'),
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {
    $(document).prop('title', 'Vendor Maintenance');
    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

    $.fn.bootstrapBtn = $.fn.button.noConflict();
  }).fail(function () {
    console.error('Failed to load required scripts');
  });

  // Submit gate: defer to validateAdd/validateEdit based on action.
  $('.Submit').on("click", function (e) { submitForm(e); });

  // Hook when lookup data (departments/user types) is available.
  $(document).on('lookupcomplete', function () {
    generateTableButtons(".edit-vendor-col", "ui-icon-pencil", "Edit Vendor", "callEditVendor");
    if (isAdminUser()) {
      if ($('.add-button').length === 0) {
        const add_button = '<div class="ui-button add-button" onclick="callAddVendor()"><span title="Add Vendor" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Vendor</div>'
        $(add_button).insertBefore('.vendor-table table');
      }
    }
  });

  // Post-initialization after lookup load completes.
  $(document).on("onloadlookupfinished", function () {

    generateGoBackButtons();
    // Normalize network username on load.
    $('.network-user-name input').trigger("change");

  });

});


/**
 * Switches the UI into Add User mode.
 * - Selects the "Add" action radio
 * - Sets .add-user-id to 1
 * - Reveals the Submit button
 */
function callAddVendor() {
  if (!isAdminUser()) {
    return;
  }
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-vendor-id input').val(1).trigger("change");
  $('.Submit').show();
}


/**
 * Switches the UI into Edit User mode for the specified user.
 * - Selects the "Edit" action radio
 * - Sets .edit-user-id to the passed userID
 * - Reveals the Submit button only if current user is admin
 * @param vendorID
 */
function callEditVendor(vendorID) {
  $(`.action-choice input[type='radio'][value='2']`).prop("checked", true);
  $('.edit-vendor-id input').val(vendorID).trigger("change");
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


/**
 * Resets Add/Edit state and hides the Submit button.
 * - Clears .add-user-id and .edit-user-id
 */
function callGoBack() {
  $(".add-vendor-id input").val(0).trigger("change");
  $(".edit-vendor-id input").val(0).trigger("change");
  $('.Submit').hide();
}


/**
 * Creates a "Go Back" button near each element with class .gobackbutton and removes the original placeholder.
 * The button invokes callGoBack().
 */
function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function () {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


/**
 * Ensures per-row action buttons exist inside the given column selector.
 * - Reads the button value from an input[type=text] in the column (usually a hidden id exposed via text field).
 * - Appends an icon button that calls the provided function with the value.
 * @param {string} buttonSelector - CSS selector matching cells to augment (e.g., ".edit-button-col").
 * @param {string} buttonClass - jQuery UI icon class (e.g., "ui-icon-pencil").
 * @param {string} buttonTitle - Tooltip/title for the icon.
 * @param {string} buttonFunction - Global function name to invoke, receives the value as first argument.
 */
function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction) {
  const selectionString = buttonSelector + " input[type=text]";
  const buttons = $(selectionString);
  buttons.each(function () {
    const btn_value = $(this).val();
    const btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`

    const has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button === 0) {
      $(this).parent().append(btn_html);
    }
  });
}


/**
 * @returns {boolean} True when the current user is an admin user.
 */
function isAdminUser() {
  return $('.user-isadmin input').val() === '1';

}
