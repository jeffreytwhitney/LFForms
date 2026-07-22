$(document).ready(
  function () {
    $('.Submit').hide();
    $(document).prop('title', 'Gage User Maintenance');

    $('.edit-user-is-active-value input').on("change", function () {
      $('.edit-user-is-active-combo select').val(Number($('.edit-user-is-active-value input').val()));
    });
    $('.edit-user-is-admin-value input').on("change", function () {
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

  const isactive = $("[id^='Field76']");
  isactive.each(function () {
    const isactive_value = $(this).val();
    if (isactive_value === '1') {
      $(this).val('Yes');
    }
    else {
      $(this).val('No');
    }
  });


  const isadmin = $("[id^='Field77']");
  isadmin.each(function () {
    const isadmin = $(this).val();
    if (isadmin === '1') {
      $(this).val('Yes');
    }
    else {
      $(this).val('No');
    }
  });

}


function callEditUser(user_id) {
  $("#Field40-0").prop("checked", true).trigger("change");
  $("#Field9").val(user_id).trigger("change");
  $('.Submit').show();
}


function callAddUser() {

  $("#Field40-1").prop("checked", true).trigger("change");
  $("#Field11").val(1).trigger("change");
  $('.Submit').show();

}

function checkPermissions() {

  const employee_number = $("#Field14").val();
  const is_user_active = Number($("#Field16").val());
  const is_user_admin = Number($("#Field17").val());
  let return_val = true;

  if (is_user_active === 0) {
    return_val = false;
  }

  if (is_user_admin === 0) {
    return_val = false;
  }

  if (employee_number === '') {
    return_val = false;
  }

  return return_val;
}



function generateAddButton() {
  const add_buttons = $(".addbutton");
  const is_admin = checkPermissions();

  add_buttons.each(function () {
    if (is_admin) {
      $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='Add User' onclick='callAddUser()' />");
    }
    else {
      $(this).replaceWith("");
    }
  });

}


function generateEditButtons() {
  const is_admin = checkPermissions();
  const edit_buttons = $(".edit-button input[type=text]");
  edit_buttons.each(function () {
    const btn_value = $(this).val();
    if (is_admin) {
      $(this).parent().append("<input class='edit' type='button' value='Edit' onclick='callEditUser(" + btn_value + ")' />");
    }

  });
}


function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function () {
    $(this).replaceWith("<input class='return' type='button' value='Go Back' onclick='goBack()' />");
  });
}

function goBack() {
  $("#Field9").val("").trigger("change"); //edit
  $("#Field11").val("").trigger("change"); //add
  $('.Submit').hide();
}
