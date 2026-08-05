$(function () {
  $('.Submit').hide();
  $('#q28').hide();
  $('#q70').hide();
  
  $(document).prop('title', 'Gage History');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://pagination.js.org/dist/2.6.0/pagination.css">');
  
  
  
  $(document).on("onloadlookupfinished", function() {
    
    $('.ticket-history-table table tbody tr').addClass("ticket-history-row");
    generateTicketDetailButtons();
    generateTicketHistoryFilterRow();
    populateTicketHistoryFilterCombos();
    wireupTicketHistoryFilterFieldEvents();
    
    formatDateFields('Field26');
    formatDateFields('Field27');
    tabifyFormSections();
    generateGoBackButtons();
    
    $('.ticket-history-table').css("visibility", "visible");
  });
  
  
  $(document).on("lookupcomplete",function(e) {

    if (e.triggerId === 'Field14'){
      processTicketDetailLookup();
    }

  });

});


function processTicketDetailLookup(){

  const ticketTypeID = $("#Field15").val();

  if (ticketTypeID === 1) {
	formatDateFields('Field60');
    $('#q70').show();
  }
  if (ticketTypeID === 2) {
    formatDateFields('Field35');
    formatDateFields('Field50');
    $('#q28').show();
  }
  if (ticketTypeID === 3) {
    //formatDateFields('?'); 
  }

}


function tabifyFormSections(){
  $('#q0 .cf-section-block').wrapAll('<div id="top-tabs"></div>');
  $('#top-tabs').prepend('<ul id="top-tab-links"><li><a href="#q1"><span>Ticket History</span></a></li><li><a href="#q71"><span>History by Bin Number</span></a></li><li><a href="#q72"><span>History By Thread Gage Name</span></a></li>');
  
  
  $('#q28 ul').wrap('<div id="bin-tabs"></div>');
  $('#bin-tabs').prepend('<p><a class="gobackbutton" href="http://goback" title="http://goback" target="_blank">goback</a><br></p><ul id="bin-tab-links"><li><a href="#q33"><span>Gage History</span></a></li><li><a href="#q53"><span>Calibration History</span></a></li></ul>');
  $('#q70 ul').wrap('<div id="pin-tabs"></div>');
  $('#pin-tabs').prepend('<p><a class="gobackbutton" href="http://goback" title="http://goback" target="_blank">goback</a><br></p><ul id="thread-tab-links"><li><a href="#q58"><span>Gage History</span></a></li><li><a href="#q66"><span>Calibration History</span></a></li></ul>');
  $('#pin-tabs').tabs();
  $('#bin-tabs').tabs();
  $('#top-tabs').tabs();
}


function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function() {
    $(this).replaceWith("<input class='return' type='button' value='Go Back' onclick='goBack()' />");
  });
}


function generateTicketDetailButtons() {
  const $detail_buttons = $(".details-button-col input[type=text]");
  $detail_buttons.each(function() {
    const $ticket_id = $(this).val();
    const $ticket_type_id = $(this).closest('.ticket-history-row').find('.ticket-type-id-col input[type=text]').val();
    $(this).parent().append(`<input class='return' type='button' value='Details' onclick='callDetails(${$ticket_id}, ${$ticket_type_id})' />`);
  });
}


function generateTicketHistoryFilterRow() {
  const $filter_row = "<tr id='filterRow'><td/><td><input type='text' name='txtTicketFilter_TicketNumber' id='txtTicketFilter_TicketNumber'></td><td><select name='cboTicketFilter_TicketType' id='cboTicketFilter_TicketType'></td><td><select name='cboTicketFilter_TicketStatus' id='cboTicketFilter_TicketStatus'></td><td><select name='cboTicketFilter_Operator' id='cboTicketFilter_Operator'></td><td><select name='cboTicketFilter_CellLeader' id='cboTicketFilter_CellLeader'></td><td><select name='cboTicketFilter_Department' id='cboTicketFilter_Department'></td><td><select name='cboTicketFilter_Machine' id='cboTicketFilter_Machine'></td><td><select name='cboTicketFilter_MachineGroup' id='cboTicketFilter_MachineGroup'></td><td><input type='text' name='txtTicketFilter_JobLot' id='txtTicketFilter_JobLot'></td><td><input type='text' name='txtTicketFilter_PartNumber' id='txtTicketFilter_PartNumber'></td><td><input type='text' name='txtTicketFilter_CreateStartDate' id='txtTicketFilter_CreateStartDate'><input type='text' name='txtTicketFilter_CreateEndDate' id='txtTicketFilter_CreateEndDate'></td><td/><td/></tr>";
  $('.ticket-history-table table tbody tr:first').parent().prepend($filter_row);
}


function populateTicketHistoryFilterCombos() {

  $("#cboTicketFilter_TicketType").html($("#Field40").html());
  $("#cboTicketFilter_Department").html($("#Field38").html());
  $("#cboTicketFilter_MachineGroup").html($("#Field39").html());
  $("#cboTicketFilter_TicketStatus").html($("#Field41").html());
  fillComboBoxWithUniqueValues('#cboTicketFilter_Operator', "Field16");
  fillComboBoxWithUniqueValues('#cboTicketFilter_CellLeader', "Field18");
  fillComboBoxWithUniqueValues('#cboTicketFilter_Machine', "Field24");
}


function callDetails(ticket_id, ticketTypeID) {
  $('.ticket-history-table').hide();
  $('#top-tab-links').hide();
  
  $("#Field14").val(ticket_id).trigger("change");
  $("#Field15").val(ticketTypeID).trigger("change");
  
  
}


function fillComboBoxWithUniqueValues(comboBoxSelector, rowSelector) {
  const comboBox = $(comboBoxSelector);
  const rowSelectorString = `[id^=${rowSelector}]`;
  const comboSelectorString = `${comboBoxSelector} option`;
  comboBox.empty();
  comboBox.append($('<option>', {
    value: "",
    text: ""
  }));

  const rows = $(rowSelectorString);
  rows.each(function() {
    const row_Value = $(this).val();
    const isExist = !! $(comboSelectorString).filter(function() {
      return $(this).attr('value').toLowerCase() === row_Value.toLowerCase();
    }).length;

    if (!isExist) {
      $(comboBoxSelector).append($('<option>', {
        value: row_Value,
        text: row_Value
      }));
    }
  });
  sortComboBox(comboBoxSelector);
}
	
	
function sortComboBox(selector) {
  let selector_options = `${selector} option`;
  const options = $(selector_options);
  const arr = options.map(function(_, o) {
    return {
      t: $(o).text(),
      v: o.value
    };
  }).get();
  arr.sort(function(o1, o2) {
    return o1.t > o2.t ? 1 : o1.t < o2.t ? -1 : 0;
  });
  options.each(function(i, o) {
    o.value = arr[i].v;
    $(o).text(arr[i].t);
  });
}


function wireupTicketHistoryFilterFieldEvents() {

  $("#txtTicketFilter_TicketNumber").on("change", function() {filterTicketHistoryRows();});
  $("#cboTicketFilter_TicketType").on("change", function() {filterTicketHistoryRows();});
  $("#cboTicketFilter_MachineGroup").on("change", function() {filterTicketHistoryRows();});
  $("#cboTicketFilter_TicketStatus").on("change", function() {filterTicketHistoryRows();});
  $("#cboTicketFilter_Operator").on("change", function() {filterTicketHistoryRows();});
  $("#cboTicketFilter_CellLeader").on("change", function() {filterTicketHistoryRows();});
  $("#cboTicketFilter_Department").on("change", function() {filterTicketHistoryRows();});
  $("#cboTicketFilter_Machine").on("change", function() {filterTicketHistoryRows();});
  $("#cboTicketFilter_MachineGroup").on("change", function() {filterTicketHistoryRows();});
  $("#txtTicketFilter_JobLot").on("change", function() {filterTicketHistoryRows();});
  $("#txtTicketFilter_PartNumber").on("change", function() {filterTicketHistoryRows();});
  $("#txtTicketFilter_CreateStartDate").on("change", function() {filterTicketHistoryRows();});
  $("#txtTicketFilter_CreateEndDate").on("change", function() {filterTicketHistoryRows();});

}


function goBack() {
  $('#q28').hide();
  $('#q70').hide();
  
 
  $("#Field14").val("").trigger("change");
  $("#Field15").val("").trigger("change");
  
  $('#top-tab-links').show();
  $('.ticket-history-table').show();

}


function formatDateFields(selector){
  const dateFields = $(`[id^='${selector}']`);
  dateFields.each(function() {
    $(this).val($(this).val().split(" ")[0]);
  });
}

  
function shouldFilterRows() {
  let returnVal = false;
  
  if ($('#txtTicketFilter_TicketNumber').val() !== '') {returnVal = true;}
  if ($('#cboTicketFilter_TicketType').val() !== '') {returnVal = true;}
  if ($('#cboTicketFilter_TicketStatus').val() !== '') {returnVal = true;}
  if ($('#cboTicketFilter_Operator').val() !== '') {returnVal = true;}
  if ($('#cboTicketFilter_CellLeader').val() !== '') {returnVal = true;}
  if ($('#cboTicketFilter_Department').val() !== '') {returnVal = true;}
  if ($('#cboTicketFilter_Machine').val() !== '') {returnVal = true;}
  if ($('#cboTicketFilter_MachineGroup').val() !== '') {returnVal = true;}
  if ($('#txtTicketFilter_JobLot').val() !== '') {returnVal = true;}
  if ($('#txtTicketFilter_PartNumber').val() !== '') {returnVal = true;}
  if ($('#txtTicketFilter_CreateStartDate').val() !== '') {returnVal = true;}
  if ($('#txtTicketFilter_CreateEndDate').val() !== '') {returnVal = true;}
  
  return returnVal;
}


function filterTicketHistoryRows() {

  $(".ticket-history-row").show();
  if (!shouldFilterRows()) {
    return;
  }

  const ticketNumberFilter = $('#txtTicketFilter_TicketNumber').val().toLowerCase();
  const ticketTypeFilter = $('#cboTicketFilter_TicketType').val().toLowerCase();
  const ticketStatusFilter = $('#cboTicketFilter_TicketStatus').val().toLowerCase();
  const operatorFilter = $('#cboTicketFilter_Operator').val().toLowerCase();
  const cellLeaderFilter = $('#cboTicketFilter_CellLeader').val().toLowerCase();
  const departmentFilter = $('#cboTicketFilter_Department').val().toLowerCase();
  const machineFilter = $('#cboTicketFilter_Machine').val().toLowerCase();
  const machineGroupFilter = $('#cboTicketFilter_MachineGroup').val().toLowerCase();
  const joblotFilter = $('#txtTicketFilter_JobLot').val().toLowerCase();
  const partNumberFilter = $('#txtTicketFilter_PartNumber').val().toLowerCase();
  const createStartDateFilter = Date.parse($('#txtTicketFilter_CreateStartDate').val());
  const createEndDateFilter = Date.parse($('#txtTicketFilter_CreateEndDate').val());

  const gage_rows = $(".ticket-history-row");
  gage_rows.each(function() {

    if (ticketNumberFilter !== '') {
      const row_ticketNumber = $(this).find('.ticket-number-col input[type=text]').val().toLowerCase();
      if (!row_ticketNumber.includes(ticketNumberFilter)) {
        $(this).hide();
        return;
      }
    }

    if (ticketTypeFilter !== '') {
      const row_ticketType = $(this).find('.ticket-type-col input[type=text]').val().toLowerCase();
      if (ticketTypeFilter !== row_ticketType) {
        $(this).hide();
        return;
      }
    }

    if (ticketStatusFilter !== '') {
      const row_ticketStatus = $(this).find('.ticket-status-col input[type=text]').val().toLowerCase();
      if (ticketStatusFilter !== row_ticketStatus) {
        $(this).hide();
        return;
      }
    }
    
    if (operatorFilter !== '') {
      const row_Operator = $(this).find('.operator-col input[type=text]').val().toLowerCase();
      if (operatorFilter !== row_Operator) {
        $(this).hide();
        return;
      }
    }
    
    if (cellLeaderFilter !== '') {
      const row_CellLeader = $(this).find('.cell-leader-col input[type=text]').val().toLowerCase();
      if (cellLeaderFilter !== row_CellLeader) {
        $(this).hide();
        return;
      }
    }
    
    if (departmentFilter !== '') {
      const row_department = $(this).find('.department-col input[type=text]').val().toLowerCase();
      if (departmentFilter !== row_department) {
        $(this).hide();
        return;
      }
    }
    
    if (machineFilter !== '') {
      const row_Machine = $(this).find('.machine-name-col input[type=text]').val().toLowerCase();
      if (machineFilter !== row_Machine) {
        $(this).hide();
        return;
      }
    }

    if (machineGroupFilter !== '') {
      const row_machineGroup = $(this).find('.machine-group-col input[type=text]').val().toLowerCase();
      if (machineGroupFilter !== row_machineGroup) {
        $(this).hide();
        return;
      }
    }

    if (joblotFilter !== '') {
      const row_JobLot = $(this).find('.joblot-col input[type=text]').val().toLowerCase();
      if (!row_JobLot.includes(joblotFilter)) {
        $(this).hide();
        return;
      }
    }
    
    if (partNumberFilter !== '') {
      const row_PartNumber = $(this).find('.part-number-col input[type=text]').val().toLowerCase();
      if (!row_PartNumber.includes(partNumberFilter)) {
        $(this).hide();
        return;
      }
    }
        
    if (!Number.isNaN(createStartDateFilter)) {
      const row_StartDate = Date.parse($(this).find('.creation-date-col input[type=text]').val());
      if (createStartDateFilter >= row_StartDate) {
        $(this).hide();
        return;
      }
    }
    
    if (!Number.isNaN(createEndDateFilter)) {
      const row_EndDate = Date.parse($(this).find('.creation-date-col input[type=text]').val());
      if (createEndDateFilter <= row_EndDate) {
        $(this).hide();
      }
    }
    
  });

}
