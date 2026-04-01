const departmentMap = new Map();
const departmentNameMap = new Map();


$(document).ready(function () {
  $('.Submit').hide();
  $('.Submit').on("click", function (e) { validateForm(e); });
  $(document).prop('title', 'Cell Leader Maintenance');

  $('.edit-cellleader-isactive-value input').on("change", function () {
    $('.edit-cellleader-isactive-combo select').val(Number($('.edit-cellleader-isactive-value input').val()));
  });

  $('.edit-cellleader-isactive-combo select').on("change", function () {
    $('.edit-cellleader-isactive-value input').val(Number($('.edit-cellleader-isactive-combo select').val()));
  });

  $('.edit-cellleader-department-id input').on("change", function () {
    const department_name = departmentMap.get(Number($('.edit-cellleader-department-id input').val()))
    $('.edit-cellleader-department-combo select').val(department_name);
  });



  $(document).on("onloadlookupfinished", function () {

    generateEditButtons();
    generateAddButton();
    generateGoBackButtons();
    changeNumericToYesNo();



  });

  $(document).on('lookupcomplete', function (e) {
    loadDepartmentMap();
    $('.assign-to-id input').off('change');
    $('.assign-to-id input').on("change", function () {
      validateForm();
    });

  });

});


function changeNumericToYesNo() {

  const isactive = $("[id^='Field26']");
  isactive.each(function (index) {
    const isactive_value = $(this).val();
    if (isactive_value === '1') {
      $(this).val('Yes');
    }
    else {
      $(this).val('No');
    }
  });
}


function callEditCellLeader(user_id) {
  $("#Field8-0").prop("checked", true).trigger("change");
  $(".edit-cellleader-id input").val(user_id).trigger("change");
  $('.Submit').show();
}


function callAddUser() {

  $("#Field8-1").prop("checked", true).trigger("change");
  $(".add-cellleader-id input").val(1).trigger("change");
  $('.Submit').show();

}


function checkPermissions() {

  const employee_number = $(".user-employee-number input").val();
  const is_user_active = Number($(".user-isactive input").val());
  const is_user_admin = Number($(".user-isadmin input").val());
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

  add_buttons.each(function (index) {
    if (is_admin) {
      $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='Add Cell Leader' onclick='callAddUser()' />");
    }
    else {
      $(this).replaceWith("");
    }
  });

}


function generateEditButtons() {
  const is_admin = checkPermissions();
  const edit_buttons = $(".edit-button input[type=text]");
  edit_buttons.each(function (index) {
    const btn_value = $(this).val();
    if (is_admin) {
      $(this).parent().append("<input class='edit' type='button' value='Edit' onclick='callEditCellLeader(" + btn_value + ")' />");
    }

  });
}


function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).replaceWith("<input class='return' type='button' value='Go Back' onclick='goBack()' />");
  });
}


function goBack() {
  $(".edit-cellleader-id input").val("").trigger("change"); //edit
  $(".add-cellleader-id input").val("").trigger("change"); //add
  $('.Submit').hide();
}


function loadDepartmentMap() {
  if (departmentMap.keys.length === 0) {
    const department_rows = $('.department-lookup-table table tbody tr');
    if (department_rows.length === 0) {
      return;
    }
    department_rows.each(function (index) {
      departmentID = Number($(this).find('.department-lookup-table-id input').val());
      departmentName = $(this).find('.department-lookup-table-name input').val();
      departmentMap.set(departmentID, departmentName);
      departmentNameMap.set(departmentName, departmentID);
    });
  }
}


function validateForm(e) {
  
  let isValid = true;
  $('.assign-to-cell-leader-combo-col input').removeClass('parsley-error');
  $('#bad-cell-leader-error').remove();

  const editedCellLeaderID = Number($('.edit-cellleader-id input').val());
  const countOfActiveTickets = Number($('.count-of-cell-leader-tickets input').val());

  if (countOfActiveTickets === 0) {
    return;
  }
  const ticketRows = $('.cell-leader-ticket-table table tbody tr');

  ticketRows.each(function (index) {
    const cellLeaderAssigneeID = Number($(this).find('.assign-to-id input').val());
    const cellLeaderAssigneeName = $(this).find('.assign-to-cell-leader-combo-col select');

    if (cellLeaderAssigneeID === editedCellLeaderID) {
      cellLeaderAssigneeName.parent().append("<ul id='bad-cell-leader-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Cannot assign ticket to Cell Leader you're trying to make inactive.</li></ul>");
      cellLeaderAssigneeName.addClass('parsley-error');
      isValid = false;
    }
  });

  if (isValid === false) {
    if (arguments.length === 1) {
      e.preventDefault();
    }
  }


}