const assigneeMap = new Map();
const assigneeNameMap = new Map();
const machineTypeMap = new Map();
const machineTypeNameMap = new Map();

$(function () {
  $(document).prop('title', 'PM Group Edit');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  $.fn.bootstrapBtn = $.fn.button.noConflict();

  $('.Submit').on("click", function (e) { submitForm(e); });

  $(document).on('click', '#chkSelectAll', function () {
    if ($("#chkSelectAll").is(":checked")) {
      selectAllPMs(true);
    }
    else {
      selectAllPMs(false);
    }
  });

  $(document).on('change', 'input[id^="Field14"]', function () {
    fillSelectedIDs();
    if (this.checked) {
      $(this).closest('tr').find('.selected-value input').val(1);
    } else {
      $(this).closest('tr').find('.selected-value input').val(0);
    }
    $('.select-task-count input').val(getSelectedCount());
  });


  $(document).on("onloadlookupfinished", function () {
    const lfUserName = $('.lf-user-name input').val();
    $('.network-user-name input').val(lfUserName.toUpperCase().slice(lfUserName.lastIndexOf('\\') + 1)).trigger("change");
  });

  $(document).on('lookupcomplete', function () {
    loadAssigneeMap();
    loadMachineTypeMap();
    generateFilterRow();
    $('#chkSelectAll').parent().removeAttr('aria-hidden').removeClass('hidden').removeClass('lf-container-hidden');
  });

});


function filterTable() {
  if ($('#filterRow').length === 0) {
    return;
  }

  $("#chkSelectAll").prop('checked', false);
  selectAllPMs(false);

  const machineTypeFilterVal = $('#cboFilter_MachineType').val();
  const assigneeFilterVal = $('#cboFilter_Assignee').val();


  if ((machineTypeFilterVal !== null) && (machineTypeFilterVal.length > 0)) {
    const machineTypeID = machineTypeNameMap.get(machineTypeFilterVal);
    $('.fmtid input').val(machineTypeID).trigger("change");
  } else {
    $('.fmtid input').val(0).trigger("change");
  }

  if ((assigneeFilterVal !== null) && (assigneeFilterVal.length > 0)) {
    const assigneeID = assigneeNameMap.get(assigneeFilterVal);
    $('.faid input').val(assigneeID).trigger("change");
  } else {
    $('.faid input').val(0).trigger("change");
  }

}


function fillSelectedIDs() {
  const checkboxes = $("input[id^='Field14']");
  const selectedIDField = $('.selected-id-list input');
  $(selectedIDField).val('');
  if (checkboxes.length === 0) {
    return;
  }
  checkboxes.each(function () {
    if ($(this).is(':checked')) {
      const pm_id = $(this).closest('tr').find('.id-col input').val();
      if (selectedIDField.val() === '') {
        selectedIDField.val(pm_id);
      }
      else {
        selectedIDField.val(selectedIDField.val() + ',' + pm_id);
      }
    }
  });
}


function generateFilterRow() {
  if ($('#filterRow').length === 0) {
    const filter_row = "<TR id='filterRow'><TH><input name='chkSelectAll' id='chkSelectAll' type='checkbox' class='check-all-manual'></TH><TH/><TH/><TH><select id='cboFilter_MachineType'/></TH><TH/><TH/><TH><select id='cboFilter_Assignee'/></TH><TH/><TH/></TR>"
    $('.pm-table table thead').append(filter_row);

    $("#cboFilter_MachineType").on("change", function () {
      filterTable();
    });
    $("#cboFilter_Assignee").on("change", function () {
      filterTable();
    });


    $("#cboFilter_MachineType").on("dblclick", function () {
      $("#cboFilter_MachineType").val(0).trigger("change");
    });

    $("#cboFilter_Assignee").on("dblclick", function () {
      $("#cboFilter_Assignee").val(0).trigger("change");
    });
    //wireUpSortFields();

  }

  if (($(".machine-type-lookup-combo select option").length > 1) && ($("#cboFilter_MachineType option").length === 0)) {
    $("#cboFilter_MachineType").html($(".machine-type-lookup-combo select").html());
  }
  if (($(".assignee-lookup-combo select option").length > 1) && ($("#cboFilter_Assignee option").length === 0)) {
    $("#cboFilter_Assignee").html($(".assignee-lookup-combo select").html());
  }
}


function getSelectedCount() {
  const checkboxes = $("input[id^='Field14']");
  if (checkboxes.length === 0) {
    return 0;
  }
  let count = 0;
  checkboxes.each(function () {
    if ($(this).is(':checked')) {
      count++;
    }
  });
  return count;
}


function isAdminUser() {
  return $('.user-isadmin input').val() === '1';

}


function loadAssigneeMap() {

  if (assigneeMap.keys.length === 0) {
    const assignee_rows = $('.assignee-lookup-table table tbody tr');
    if (assignee_rows.length === 0) {
      return;
    }
    assignee_rows.each(function () {
      let assigneeID = Number($(this).find('.assignee-lookup-table-id input').val());
      let assigneeName = $(this).find('.assignee-lookup-table-name input').val();
      assigneeMap.set(assigneeID, assigneeName);
      assigneeNameMap.set(assigneeName, assigneeID);
    });
  }
}


function loadMachineTypeMap() {
  const machine_type_rows = $('.machine-type-lookup-table table tbody tr');
  if (machine_type_rows.length === 0) {
    return;
  }

  machineTypeMap.clear();
  machineTypeNameMap.clear();
  machine_type_rows.each(function () {
    const machineTypeID = Number($(this).find('.machine-type-lookup-table-id input').val());
    const machineTypeName = $(this).find('.machine-type-lookup-table-name input').val();
    machineTypeMap.set(machineTypeID, machineTypeName);
    machineTypeNameMap.set(machineTypeName, machineTypeID);
  });
}


function selectAllPMs(check_on) {
  const checkboxes = $("input[id^='Field14']");
  if (checkboxes.length === 0) {
    return;
  }
  checkboxes.each(function () {
    if (check_on === true)
      $(this).prop('checked', true).trigger("change");
    else
      $(this).prop('checked', false).trigger("change");
  });
  fillSelectedIDs();
  $('.select-task-count input').val(getSelectedCount());
}


function sortTable(newSortOrdinal, selector) {

  removeAppendedFields();
  $('.sort-icon').remove();

  const currentSortOrdinal = Number($('.sort-field-ordinal input').val());
  let sortDirection = Number($('.sort-direction input').val());

  if (newSortOrdinal === currentSortOrdinal) {
    if (sortDirection === 0) {
      sortDirection = 1
      $('.sort-direction input').val(1).trigger("change");
    }
    else {
      sortDirection = 0;
      $('.sort-direction input').val(0).trigger("change");
    }
  }
  else {
    $('.sort-field-ordinal input').val(newSortOrdinal);
    $('.sort-direction input').val(0).trigger("change");
    sortDirection = 0;
  }

  if (sortDirection === 0) {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
  }
  else {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
  }
}


function wireUpSortFields() {

  $('#q24 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');

  $('#q24').on('click', function () { sortTable(0, '#q24'); });//Task Name (default)
  $('#q25').on('click', function () { sortTable(1, '#q25'); });//Task Type
  $('#q26').on('click', function () { sortTable(2, '#q26'); });//Assignee
  $('#q27').on('click', function () { sortTable(3, '#q27'); });//Status
  $('#q29').on('click', function () { sortTable(4, '#q29'); });//Due Date
  $('#q30').on('click', function () { sortTable(5, '#q30'); });//Sched Due Date
  $('#q31').on('click', function () { sortTable(6, '#q31'); });//Total Hours


}


function submitForm(e) {
  if (validateForm() === false) {
    e.preventDefault();
    return;
  }

  if ($('.update-assignee-id input').val() === '') {
    $('.update-assignee-id input').val(0);
  }
}


function validateForm() {
  $(".tasklist-table table tbody tr").removeClass('parsley-error');
  $('.error-message input').val('');
  $('.color-error').removeClass('color-error');

  let formIsValid = true;
  const selectedCount = getSelectedCount();
  if (selectedCount === 0) {
    $.alert({
      title: 'Error',
      content: 'Please select at least one PM to update.',
      type: 'red',
      typeAnimated: true,
      buttons: {
        ok: function () { }
      }
    });
    formIsValid = false;
  }

  return formIsValid;
}
