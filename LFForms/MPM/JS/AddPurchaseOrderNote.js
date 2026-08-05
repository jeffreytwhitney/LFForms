$(function () {

  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substring($('.lf-user-name input').val().lastIndexOf('\\') + 1)).trigger("change");

  $('.Submit').on("click", function (e) {
    e.preventDefault();
    $('.closeme input').val(1);
    $(this.form).trigger("submit");
  });

  if ($('.closeme input').val() === '1') {
    window.parent.postMessage('CloseDialog', '*');
  }


/**
* onloadlookupfinished Event Handler
* Checks user permissions and disables form elements if the user lacks the necessary rights to add notes.
*/
  $(document).on('lookupcomplete', function () {

    //If the user is not an admin user, disable the Submit button.
    if (!isMetrologyUser()) {
      $('.note-text textarea').prop('disabled', true);
      $('.Submit').prop('disabled', true);
      if ($('.error').length === 0) {
        $('#q11').append('<p class="error"><b><font-size="4">You do not have permission to add notes to Purchase Orders.</font></b></p>');
      }
    }
    else{
      $('.note-text textarea').removeAttr('disabled');
      $('.Submit').removeAttr('disabled');
      $('.error').remove();
    }


    //If there is no purchase order ID, disable the Submit button.
    if (($('.poid input').val() === null) || ($('.poid input').val().length === 0)) {
      $('.note-text textarea').prop('disabled', true);
      $('.Submit').prop('disabled', true);
    }

  });

});

/**
* @returns {boolean} True when the current user is an admin user.
*/
function isAdminUser() {
  return $('.user-isadmin input').val() === '1';
}


/**
 * Determines whether the current user is classified as a "Metrology" user.
 * Business Rule: user-type-id == 1 => elevated privilege.
 * @returns {boolean} True if metrology user; false otherwise.
 */
function isMetrologyUser() {
  const userTypeId = Number($('.user-type-id input').val());
  return userTypeId === 1 || userTypeId === 2;
}
