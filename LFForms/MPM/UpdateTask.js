const status_NotStarted = 1;
const status_Started = 2;
const status_Waiting = 3;
const status_Completed = 4;
const status_Cancelled = 5;
const status_NotSched = 7;

const fieldToUpdate_Assignee = 1;
const fieldToUpdate_Status = 2;
const fieldToUpdate_DueDate = 3;
const fieldToUpdate_SchedDueDate = 4;
const validUpdateFields = [1, 2, 3, 4];

$(document).ready(function () {
  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();

  $(document).on("onloadlookupfinished", function (e) {
    
    if ($('.closeme input').val().length == 0) {
      if (validateForm() == true) {
        $('.closeme input').val(1);
        $(".Submit").trigger('click');
      }
    }
  });

});


function checkPermissions() {

  var user_id = $(".user-id input").val();
  var is_active_user = $(".user-isactive input").val();
  var user_type_id = $(".user-type-id input").val();
  var user_department_id = $(".user-department-id input").val();
  var init_department_id = $(".initdid input").val();
  var init_usertype_id = $(".initutid input").val();


  if (is_active_user == 0) {
    return false;
  }

  if (user_id == 0) {
    return false;
  }

  if (user_type_id != 1) {
    if (user_department_id != init_department_id) {
      return false;
    }
    if (user_type_id != init_usertype_id) {
      return false;
    }
  }

  return true;

}


function validateForm() {
  if (checkPermissions() == false) {
    $('#validation-message').text('No Permissions!');
    return false;
  }
  if ($('.tid input').val() == 0) {
    $('#validation-message').text('No Task!');
    return false;
  }
  if ($('.pid input').val().length == 0) {
    $('#validation-message').text('No Project!');
    return false;
  }
  if ($('.ftu input').val().length == 0) {
    $('#validation-message').text('No FieldtoUpdate!');
    return false;
  }
  if ($('.fv input').val().length == 0) {
    $('#validation-message').text('No FieldValue!');
    return false;
  }
  var fieldToUpdate = Number($('.ftu input').val());
  if (!validUpdateFields.indexOf(fieldToUpdate) == -1) { 
    console.log('Invalid FieldToUpdate: ' + fieldToUpdate);
    $('#validation-message').text('Invalid FTU!');
    return false;
  }

  var status = Number($('.sid input').val());
  if (status == 0) {
    $('#validation-message').text('Invalid Status!');
    return false;
  }

  if (status == status_Completed) {
    $('#validation-message').text('Task Already Completed!');
    return false;
  }
  if (status == status_Cancelled) {
    $('#validation-message').text('Task Already Cancelled!');
    return false;
  }

  if (fieldToUpdate == fieldToUpdate_Assignee) {
    let assigneeID = $('.fv input').val();
    var assigneeIDs = $('.assignee-ids select option').map(function () { return this.value;}).get();
    if (assigneeIDs.indexOf(assigneeID) == -1) {
      $('#validation-message').text('Invalid Assignee!');
      return false;
    }
  }

  if ((fieldToUpdate == fieldToUpdate_DueDate) || (fieldToUpdate == fieldToUpdate_SchedDueDate)) {
    let isValidDateString = moment($('.fv input').val(), "M/D/YYYY", true).isValid();
    if (!isValidDateString) {
      $('#validation-message').text('Invalid Date!');
      return false;
    }
  }
  
  $('#validation-message').text('Good to Go!');
  return true;
}