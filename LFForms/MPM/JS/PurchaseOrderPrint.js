$(document).ready(function () {
  $('.Submit').hide();


  $(document).on("onloadlookupfinished", function () {

    $('#cf-formtitle label').text(generateFilterText());
    $('#cf-formtitle label').parent().append('<label style="display:block;font-size:12px;">Print Date: ' + new Date().toLocaleString() + '</label>');
    $('.site-id input').change();
    
    setTimeout(function () {
      parent.postMessage("printme", "*");
    }, 1000);
  });

  $(document).on('lookupcomplete', function (e) {
    if (($('.create-date-col input').val() != '') && ($('.create-date-col input').val() != undefined)) {
      $('.create-date-col input').val($('.create-date-col input').val().split(" ")[0]);
    }
    if (($('.last-updated-col input').val() != '') && ($('.last-updated-col input').val() != undefined)) {
      $('.last-updated-col input').val($('.last-updated-col input').val().split(" ")[0]);
    }
    if (($('.grand-total').length == 0) && ($('.purchase-order-table tbody tr').length > 0)) {
      $('.purchase-order-table tbody').append(generateGrandTotalLine());
    }
  });

});


/**
 * Generates the filter text for the report.
 * @returns {string} The generated filter text.
 */
function generateFilterText() {
  var filterText = "";
  var fincom = Number($('.fincom input').val()); 
  var freqid = Number($('.freqid input').val());
  var freqname = $('.freqname input').val();
  var fvname = $('.fvname input').val();
  var fpodesc = $('.fpodesc input').val();
  var fponum = $('.fponum input').val();
  var fdmin = $('.fdmin input').val();
  var fdmax = $('.fdmax input').val();


  if ($('.site-name input').val() != '') {
    filterText += "SELECTED FILTERS: Site= '" + $('.site-name input').val() + "'";
  }

  if (!isNaN(freqid) && (freqid > 0)) {
    filterText += ", Requester= '" + freqname + "'";
  }

  if (fvname != '') {
    filterText += ", Vendor= '" + fvname + "'";
  }

  if (fpodesc != '') {
    filterText += ", Description= '*" + fpodesc + "*'";
  }

  if (fponum != '') {
    filterText += ", PO Number= '" + fponum + "'";
  }

  if ((fdmin != '') && (fdmax == '')) {
    filterText += ", Create Date >=: '" + moment(fdmin).format('MM/DD/YYYY') + "'";
  }

  if ((fdmin == '') && (fdmax != '')) {
    filterText += ", Create Date <=: '" + moment(fdmax).format('MM/DD/YYYY') + "'";
  }

  if ((fdmin != '') && (fdmax != '')) {
    filterText += ", Create Date Between: '" + moment(fdmin).format('MM/DD/YYYY') + "' and '" + moment(fdmax).format('MM/DD/YYYY') + "'";
  }

  if (!isNaN(fincom) && (fincom > 0)) {
    filterText += ". (Active and Completed.)";
  }
  else {
    filterText += ". (Active Only.)";
  }

  return filterText;
}



function generateGrandTotalLine() {
  var grandTotal = 0;
  $('.line-total-col input[type="text"]').each(function () {

    var lineTotal = parseNumberWithCommas($(this).val());
    if (!isNaN(lineTotal)) {
      grandTotal += lineTotal;
    }
  });
  grandTotal = grandTotal.toFixed(2);
  grandTotalDisplay = grandTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  var grandTotalLine = '<tr class="grand-total"><td/><td/><td/><td/><td style="text-align:center;font-weight:bold;font-size:16px;">Grand Total: </td><td style="font-weight:bold;font-size:16px;">$ ' + grandTotalDisplay + '</td><td/><td/><td/><td/></tr>'; return grandTotalLine;
}


function parseNumberWithCommas(str) {
  if (typeof str !== "string") return NaN; // Validate input type
  const cleaned = str.replace(/,/g, '').trim();
  return parseFloat(cleaned);
}