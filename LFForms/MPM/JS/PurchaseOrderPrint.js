$(document).ready(function () {
  $('.Submit').hide();


  $(document).on("onloadlookupfinished", function () {

    console.log('onloadlookupfinished');
    $('#cf-formtitle label').text(generateFilterText());
    $('#cf-formtitle label').parent().append('<label style="display:block;font-size:12px;">Print Date: ' + new Date().toLocaleString() + '</label>');
    $('.site-id input').change();
    
    setTimeout(function () {
      console.log('Calling Mom');
      parent.postMessage("printme", "*");
    }, 1000);
  });

  $(document).on('lookupcomplete', function (e) {
    console.log('lookupcomplete');
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



function generateFilterText() {
  var filterText = "";
  var fincom = Number($('.fincom input').val()); 
  var freqid = Number($('.freqid input').val());
  var freqname = $('.freqname input').val();
  var fvname = $('.fvname input').val();
  var fponame = $('.fponame input').val();
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

  if (fponame != '') {
    filterText += ", Gage ID/SN= '*" + fponame + "*'";
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
    var lineTotal = parseFloat($(this).val());
    console.log('lineTotal: ' + lineTotal);
    if (!isNaN(lineTotal)) {
      grandTotal += lineTotal;
    }
  });
  grandTotal = grandTotal.toFixed(2);
  var grandTotalLine = '<tr class="grand-total"><td/><td/><td/><td/><td/><td/><td/><td style="text-align:center;font-weight:bold;">Grand Total: </td><td style="font-weight:bold;">$ ' + grandTotal + '</td><td/><td/><td/><td/></tr>';
  return grandTotalLine;
 }