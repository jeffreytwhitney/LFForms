
$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  $.fn.bootstrapBtn = $.fn.button.noConflict(); // return $.fn.button to previously assigned value


  $('.Submit').on("click", function (e) { validateForm(e); });
  $('.Submit').hide();

  $(document).prop('title', 'Thread Type Maintenance');




  $(document).on("onloadlookupfinished", function () {
    generateAddButton();
    generateGoBackButtons();
    generateEditButtons();
    $('.threadtype-table').show();
  });

  $(document).on('lookupcomplete', function () {

    $('.threadtype-table').show();
  });

});


function callAddPinType() {

  $("#Field9-1").prop("checked", true).trigger("change");
  $(".add-threadtype-id input").val(1).trigger("change");
  $('.Submit').show();

}


function callEditPinType(thread_id) {
  $("#Field9-0").prop("checked", true).trigger("change");
  $(".edit-threadtype-id input").val(thread_id).trigger("change");
  $('.Submit').show();
}


function checkPermissions() {

  const employee_number = $(".user-employee-number input").val();
  const is_user_active = Number($(".user-isactive input").val());
  let return_val = true;

  if (is_user_active === 0) {
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
      $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='Add Thread Type' onclick='callAddPinType()' />");
    }
    else {
      $(this).replaceWith("");
    }
  });

}


function generateEditButtons() {
  const is_admin = checkPermissions();
  $('.table-button').remove();
  const edit_buttons = $(".edit-button input[type=text]");
  edit_buttons.each(function () {
    const btn_value = $(this).val();
    if (is_admin) {
      $(this).parent().append("<input class='table-button' type='button' value='Edit' onclick='callEditPinType(" + btn_value + ")' />");
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
  $(".edit-threadtype-id input").val("").trigger("change"); //edit
  $(".add-threadtype-id input").val("").trigger("change"); //add
  $('.Submit').hide();
}




