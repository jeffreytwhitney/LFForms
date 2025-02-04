var should_print_receipt = true;
$.getScript("https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js", function () {
    WebFont.load({
        google: {
            families: ['Montserrat', 'Libre Barcode 128']
        }
    });
});
$(document).ready(function () {

    $('.Submit').hide();

    $.getScript('https://pagination.js.org/dist/2.6.0/pagination.min.js');
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $("head").append('<link rel="stylesheet" href="https://pagination.js.org/dist/2.6.0/pagination.css">');
    $("head").append('<link rel="stylesheet" href="https:/cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

    $(document).prop('title', 'Gage Maintenance');
    $('#q0').append("<div class='hidden-text' id='print_output'></div>");


    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var printEvent = window[eventMethod];
    var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";

    printEvent(messageEvent, function (e) {

        if (e.data === "printme" || e.message === "printme") {
            console.log('Print Event Called');

            $("#myiframe").get(0).contentWindow.print();
        }
    });

    $("#Field58").on("change", function () {
        var note_text = $("#Field58").val();
        note_text = note_text.replace(/'/g, '');
        note_text = note_text.replace(/"/g, '');
        $("#Field58").val(note_text);
    });


    $(document).on("onloadlookupfinished", function () {
        $('.Submit').hide();

        generateFormButtons();

        formatDateFields('Field123');
        formatDateFields('Field124');
        formatDateFields('Field166');

        tabifyFormSections();

        generateGoBackButtons();

        $('.gage-table .cf-table_parent').append('<div id="pagination" class="paginationjs-small"></div>');
        paginateTable();
        wireupComboBoxEvents();

        $('.gage-table').css("visibility", "visible");

    });


    $(document).on('lookupcomplete', function (e) {

        if (e.triggerId == 'Field219') {
            if ($('#Field219').val()) {
                if ($('#Field219').val() != "0") {
                    if ($('#Field220').val()) {
                        print_receipt();
                    }
                }
            }
        }


        if (e.triggerId == 'Field177') {
            formatDateFields('Field197');
            formatDateFields('Field205');
        }
        if (e.triggerId == 'Field175') {
            formatDateFields('Field184');
            formatDateFields('Field190');
        }
        if (e.triggerId == 'Field176') {
            formatDateFields('Field210');
            formatDateFields('Field217');
        }
    })

});


function generateFormButtons() {
    $('.gage-table-hidden table tbody tr').addClass("gage-row");
    generateButtons(".ReturnButton", "return-button", "Return", "callReturn");
    generateButtons(".CalibrateButton", "cal-button", "Calibrate", "callCalibrate");
    generateButtons(".HistoryButton", "history-button", "History", "callHistory");
    generateButtons(".PrintButton", "print-button", "Print", "callPrint");
    generateMissingButtons();
}


function checkPermissions() {

    var employee_number = $("#Field87").val();
    var is_active_user = $("#Field88").val().toString();
    var return_val = true;

    if (is_active_user == "False") {
        return_val = false;
    }

    if (employee_number == '') {
        return_val = false;
    }

    //return return_val
    return true;
}


function wireupComboBoxEvents() {

    $("#cboFilter_TicketType").on("change", function () { paginateTable(); });
    $("#cboFilter_Department").on("change", function () { paginateTable(); });
    $("#cboFilter_MachineGroup").on("change", function () { paginateTable(); });
    $("#txtFilter_TicketNumber").on("change", function () { paginateTable(); });
    $("#cboFilter_Operator").on("change", function () { paginateTable(); });
    $("#cboFilter_CellLeader").on("change", function () { paginateTable(); });
    $("#cboFilter_Machine").on("change", function () { paginateTable(); });
    $("#cboFilter_PartNumber").on("change", function () { paginateTable(); });
    $("#cboFilter_JobLot").on("change", function () { paginateTable(); });

}


function generateGoBackButtons() {
    var $goback_buttons = $(".gobackbutton");
    $goback_buttons.each(function (index) {
        $(this).parent().append("<input class='return' type='button' value='Go Back' onclick='callGoBack()' />");
    });
}


function generateButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction) {
    var selectionString = buttonSelector + " input[type=text]";
    var buttons = $(selectionString);
    buttons.each(function () {
        var btn_value = $(this).val();
        var btn_html = "<input class='" + buttonClass + "' type='button' value='" + buttonTitle + "' onclick='" + buttonFunction + "(" + btn_value + ")' />";
        $(this).parent().append(btn_html);
    });
}


function generateMissingButtons() {
    var $missing_buttons = $(".MissingButton input[type=text]");
    var $btn_value;
    var $ticket_type;
    $missing_buttons.each(function (index) {

        var $ticket_id = $(this).val();
        var $ticket_type = getTicketTypeIDByTicketID($ticket_id);
        if ($ticket_type == "3") {
            $(this).parent().append("<input class='return' type='button' value='Missing' onclick='callMissing(" + $ticket_id + ")' />");
        }
    });
}


function generateFilterRow() {
    var $filter_row = "<TR id='filterRow'><TD/><TD/><TD/><TD/><TD/><td><input type='text' name='txtFilter_TicketNumber' id='txtFilter_TicketNumber'></td><TD><select name='cboFilter_TicketType' id='cboFilter_TicketType' style='width:100%'/></TD><TD><select name='cboFilter_Department' id='cboFilter_Department' style='width:100%'/></td><td><select name='cboFilter_Machine' id='cboFilter_Machine'></td><TD><select name='cboFilter_MachineGroup' id='cboFilter_MachineGroup' style='width:100%'/></td><td><select name='cboFilter_Operator' id='cboFilter_Operator'></td><td><select name='cboFilter_CellLeader' id='cboFilter_CellLeader'></td><td><select name='cboFilter_PartNumber' id='cboFilter_PartNumber'></td><td><select name='cboFilter_JobLot' id='cboFilter_JobLot'></td><TD/><TD/><TD/><TD/><TD/><TD/><TD/><TD/></TR>";
    $('.gage-table table tbody tr:first').parent().prepend($filter_row);
    $("#cboFilter_Department").html($("#Field52").html());
    $("#cboFilter_TicketType").html($("#Field75").html());
    $("#cboFilter_MachineGroup").html($("#Field72").html());
    fillComboBoxWithUniqueValues('#cboFilter_Machine', "Field117");
    fillComboBoxWithUniqueValues('#cboFilter_Operator', "Field121");
    fillComboBoxWithUniqueValues('#cboFilter_CellLeader', "Field122");
    fillComboBoxWithUniqueValues('#cboFilter_PartNumber', "Field162");
    fillComboBoxWithUniqueValues('#cboFilter_JobLot', "Field163");
}


function callPrint(ticket_id) {
    should_print_receipt = true;
    var ticketTypeID = getTicketTypeIDByTicketID(ticket_id);
    $('#Field219').val(ticket_id);
    $('#Field220').val(ticketTypeID);
    print_receipt();
}


function callHistory(ticket_id) {

    var $ticketTypeID = getTicketTypeIDByTicketID(ticket_id);

    if ($ticketTypeID == "1") {
        $("#Field177").val(ticket_id).change();
    }
    else if ($ticketTypeID == "2") {
        $("#Field175").val(ticket_id).change();
    }
    else if ($ticketTypeID == "3") {
        $("#Field176").val(ticket_id).change();
    }

}


function callMissing(ticket_id) {

    var has_permissions = checkPermissions();
    if (has_permissions) {

        $("#Field41-3").prop("checked", true).change();
        $("#Field102").val(ticket_id).change();
        $("#Field73").val(ticket_id).change();
        $("#Field219").val(ticket_id)

        $('.Submit').show();
    }
    else {
        alert("Sorry, you do not have permissions to do this.");
    }

}


function callReturn(ticket_id) {

    $.confirm({
        title: 'Are you sure?',
        content: 'Are you sure you wish to return this ticket? It cannot be undone.',

        buttons: {
            ok: {
                text: "ok!",
                keys: ['enter'],
                action: function () {
                    var has_permissions = checkPermissions();
                    if (has_permissions) {
                        $("#filterRow").remove();
                        $("#Field41-0").prop("checked", true).change();
                        $("#Field73").val(ticket_id).change();
                        $("#form1").submit();
                    }
                    else {
                        alert("Sorry, you do not have permissions to do this.");
                    }
                }
            },
            cancel: function () {

            }
        }
    });

}


function callCalibrate(ticket_id) {
    $("#Field219").val(ticket_id)
    var has_permissions = checkPermissions();
    if (has_permissions) {
        var $ticketTypeID = getTicketTypeIDByTicketID(ticket_id);

        $("#Field41-1").prop("checked", true);

        if ($ticketTypeID == "1") {
            $("#Field27").val(ticket_id).change();
        }
        else if ($ticketTypeID == "2") {
            $("#Field45").val(ticket_id).change();
        }
        else if ($ticketTypeID == "3") {
            $("#Field61").val(ticket_id).change();
        }

        $('.Submit').show();
    }
    else {
        alert("Sorry, you do not have permissions to do this.");
    }
}


function callGoBack() {
    $("#Field27").val("").change();
    $("#Field45").val("").change();
    $("#Field61").val("").change();
    $("#Field102").val("").change();
    $('#Field175').val("").change();
    $('#Field177').val("").change();
    $('#Field176').val("").change();
    $("#Field219").val("")
    $('.Submit').hide();
}


function getTicketTypeIDByTicketID(ticket_id) {
    var $ticket_typeid;
    var $ticket_ids = $(".gage-table-hidden table .Gages_TicketID_Column");

    $ticket_ids.each(function (index) {
        var $row_ticket_id = $(this).find('input[type=text]:first').val();
        if ($row_ticket_id == ticket_id) {
            $ticket_typeid = $(this).parent().find(".Gages_TicketTypeID_Column").find('input[type=text]:first').val();
            return;
        }
    });
    return $ticket_typeid;
}


function fillComboBoxWithUniqueValues(comboBoxSelector, rowSelector) {
    var comboBox = $(comboBoxSelector);
    var rowSelectorString = `.gage-table-hidden [id^=${rowSelector}]`;
    var comboSelectorString = `${comboBoxSelector} option`;
    comboBox.empty();
    comboBox.append($('<option>', {
        value: "",
        text: ""
    }));

    var rows = $(rowSelectorString);
    rows.each(function () {
        var row_Value = $(this).val();
        var isExist = !!$(comboSelectorString).filter(function () {
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
    selector_options = `${selector} option`;
    var options = $(selector_options);
    var arr = options.map(function (_, o) {
        return {
            t: $(o).text(),
            v: o.value
        };
    }).get();
    arr.sort(function (o1, o2) {
        return o1.t > o2.t ? 1 : o1.t < o2.t ? -1 : 0;
    });
    options.each(function (i, o) {
        o.value = arr[i].v;
        $(o).text(arr[i].t);
    });
}


function formatDateFields(selector) {

    $(`[id^='${selector}']`).each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

}


function tabifyFormSections() {
    $('#q169 ul').wrap('<div id="bin-tabs"></div>');
    $('#bin-tabs').prepend('<p><a class="gobackbutton" href="http://goback" title="http://goback" target="_blank">goback</a><br></p><ul id="bin-tab-links"><li><a href="#q181"><span>Gage History</span></a></li><li><a href="#q189"><span>Calibration History</span></a></li></ul>');
    $('#bin-tabs').tabs();

    $('#q170 ul').wrap('<div id="pin-tabs"></div>');
    $('#pin-tabs').prepend('<p><a class="gobackbutton" href="http://goback" title="http://goback" target="_blank">goback</a><br></p><ul id="pin-tab-links"><li><a href="#q195"><span>Gage History</span></a></li><li><a href="#q202"><span>Calibration History</span></a></li></ul>');
    $('#pin-tabs').tabs();

    $('#q171 ul').wrap('<div id="thread-tabs"></div>');
    $('#thread-tabs').prepend('<p><a class="gobackbutton" href="http://goback" title="http://goback" target="_blank">goback</a><br></p><ul id="thread-tabs-tab-links"><li><a href="#q209"><span>Gage History</span></a></li><li><a href="#q215"><span>Calibration History</span></a></li></ul>');
    $('#thread-tabs').tabs();
}


function paginateTable() {

    if (!$('#filterRow').length) {
        generateFilterRow();
    }

    $('#pagination').pagination({
        dataSource: getfilteredRows(),
        pageSize: 15,
        callback: function (data, pagination) {
            data.unshift($('#filterRow'));
            $('.gage-table tbody').html(data);
            wireupComboBoxEvents();
        }
    })

}


function shouldFilterRows() {
    var returnVal = false;

    if ($('#txtFilter_TicketNumber').val() != '') { returnVal = true; }
    if ($('#cboFilter_TicketType').val() != '') { returnVal = true; }
    if ($('#cboFilter_Operator').val() != '') { returnVal = true; }
    if ($('#cboFilter_CellLeader').val() != '') { returnVal = true; }
    if ($('#cboFilter_Department').val() != '') { returnVal = true; }
    if ($('#cboFilter_Machine').val() != '') { returnVal = true; }
    if ($('#cboFilter_MachineGroup').val() != '') { returnVal = true; }
    if ($('#cboFilter_PartNumber').val() != '') { returnVal = true; }
    if ($('#cboFilter_JobLot').val() != '') { returnVal = true; }

    return returnVal;
}


function getfilteredRows() {
    console.log('Called GetFilterRows2');
    var rows = [];
    var filtered_rows;


    var gage_rows = $(".gage-table-hidden .gage-row")
    var ticketNumberFilter = $('#txtFilter_TicketNumber').val().toLowerCase();
    var ticketTypeFilter = $('#cboFilter_TicketType').val().toLowerCase();
    var operatorFilter = $('#cboFilter_Operator').val().toLowerCase();
    var cellLeaderFilter = $('#cboFilter_CellLeader').val().toLowerCase();
    var departmentFilter = $('#cboFilter_Department').val().toLowerCase();
    var machineFilter = $('#cboFilter_Machine').val().toLowerCase();
    var machineGroupFilter = $('#cboFilter_MachineGroup').val().toLowerCase();
    var partNumberFilter = $('#cboFilter_PartNumber').val().toLowerCase();
    var joblotFilter = $('#cboFilter_JobLot').val().toLowerCase();

    var shouldFilterRow = shouldFilterRows();
    var okToAdd = true;

    if (shouldFilterRow == false) {
        gage_rows.each((index, row) => rows.push($(row).clone()));
    }
    else {
        filtered_rows = gage_rows;

        if (ticketNumberFilter !== '') {
            filtered_rows = filtered_rows.filter((index, row) => $(row).find('.ticket-number-col input[type=text]').val().toLowerCase().includes(ticketNumberFilter));
        }
        if (ticketTypeFilter != '') {
            filtered_rows = filtered_rows.filter((index, row) => ticketTypeFilter == $(row).find('.ticket-type-col input[type=text]').val().toLowerCase());
        }
        if (operatorFilter != '') {
            filtered_rows = filtered_rows.filter((index, row) => operatorFilter == $(row).find('.operator-col input[type=text]').val().toLowerCase());
        }
        if (cellLeaderFilter != '') {
            filtered_rows = filtered_rows.filter((index, row) => cellLeaderFilter == $(row).find('.cell-leader-col input[type=text]').val().toLowerCase());
        }
        if (departmentFilter != '') {
            filtered_rows = filtered_rows.filter((index, row) => departmentFilter == $(row).find('.department-col input[type=text]').val().toLowerCase());
        }
        if (machineFilter != '') {
            filtered_rows = filtered_rows.filter((index, row) => machineFilter == $(row).find('.machine-name-col input[type=text]').val().toLowerCase());
        }
        if (machineGroupFilter != '') {
            filtered_rows = filtered_rows.filter((index, row) => machineGroupFilter == $(row).find('.machine-group-col input[type=text]').val().toLowerCase());
        }
        if (partNumberFilter != '') {
            filtered_rows = filtered_rows.filter((index, row) => partNumberFilter == $(row).find('.part-number-col input[type=text]').val().toLowerCase());
        }
        if (joblotFilter != '') {
            filtered_rows = filtered_rows.filter((index, row) => joblotFilter == $(row).find('.joblot-col input[type=text]').val().toLowerCase());
        }

        filtered_rows.each((index, row) => rows.push($(row).clone()));
    }

    return rows;
}

function loadiFrame(src) {
    $("#print_output").html("<iframe id='myiframe' name='myname' src='" + src + "' />");
}


function print_receipt() {

    var domain = document.location.hostname;
    var receipt_url_root = "http://" + domain + "/Forms/";
    var receipt_url = "";



    if ($('#Field220').val() == 1) {
        receipt_url = receipt_url_root + "PinGageReceipt?TicketID=" + $('#Field219').val();
    }
    if ($('#Field220').val() == 2) {
        receipt_url = receipt_url_root + "BinReceipt?TicketID=" + $('#Field219').val();
    }
    if ($('#Field220').val() == 3) {
        receipt_url = receipt_url_root + "ThreadReceipt?TicketID=" + $('#Field219').val();
    }

    if (should_print_receipt == true) {
        if (receipt_url != "") {
            loadiFrame(receipt_url);
            should_print_receipt == false;
            $('#Field219').val(0).change();
        }
    }
}


