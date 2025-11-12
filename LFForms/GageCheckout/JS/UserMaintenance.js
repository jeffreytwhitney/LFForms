$(document).ready(
  function () {
    $('.Submit').hide();
    $(document).prop('title', 'Gage User Maintenance');

    $('.edit-user-is-active-value input').change(function () {
      $('.edit-user-is-active-combo select').val(Number($('.edit-user-is-active-value input').val()));
    });
    $('.edit-user-is-admin-value input').change(function () {
      $('.edit-user-is-admin-combo select').val(Number($('.edit-user-is-admin-value input').val()))
    });


    $(document).on("onloadlookupfinished", function () {

      generateEditButtons();
      generateAddButton();
      generateGoBackButtons();
      changeNumericToYesNo();

      


      $('.user-table').css("visibility", "visible");

    });

  });



function changeNumericToYesNo() {

  var isactive = $("[id^='Field76']");
  isactive.each(function (index) {
    var isactive_value = $(this).val();
    if (isactive_value === '1') {
      $(this).val('Yes');
    }
    else {
      $(this).val('No');
    }
  });


  var isadmin = $("[id^='Field77']");
  isadmin.each(function (index) {
    var isadmin = $(this).val();
    if (isadmin === '1') {
      $(this).val('Yes');
    }
    else {
      $(this).val('No');
    }
  });

}


function callEditUser(user_id) {
  $("#Field40-0").prop("checked", true).change();
  $("#Field9").val(user_id).change();
  $('.Submit').show();
}


function callAddUser() {

  $("#Field40-1").prop("checked", true).change();
  $("#Field11").val(1).change();
  $('.Submit').show();

}

function checkPermissions() {

  var employee_number = $("#Field14").val();
  var is_user_active = Number($("#Field16").val());
  var is_user_admin = Number($("#Field17").val());
  var return_val = true;

  if (is_user_active == 0) {
    return_val = false;
  }

  if (is_user_admin == 0) {
    return_val = false;
  }

  if (employee_number === '') {
    return_val = false;
  }

  return return_val;
}



function generateAddButton() {
  var add_buttons = $(".addbutton");
  var is_admin = checkPermissions();

  add_buttons.each(function (index) {
    if (is_admin) {
      $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='Add User' onclick='callAddUser()' />");
    }
    else {
      $(this).replaceWith("");
    }
  });

}


function generateEditButtons() {
  var is_admin = checkPermissions();
  var edit_buttons = $(".edit-button input[type=text]");
  edit_buttons.each(function (index) {
    var btn_value = $(this).val();
    if (is_admin) {
      $(this).parent().append("<input class='edit' type='button' value='Edit' onclick='callEditUser(" + btn_value + ")' />");
    }

  });
}


function generateGoBackButtons() {
  var $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).replaceWith("<input class='return' type='button' value='Go Back' onclick='goBack()' />");
  });
}

function goBack() {
  $("#Field9").val("").change(); //edit
  $("#Field11").val("").change(); //add
  $('.Submit').hide();
}