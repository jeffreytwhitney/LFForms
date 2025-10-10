$(document).ready(function () {
  $('.Submit').hide();


  $(document).on("onloadlookupfinished", function () {
    console.log('Calling Mom');
    parent.postMessage("printme", "*");
    $('.create-date-col input').val($('.create-date-col input').val().split(" ")[0]);
    $('.last-updated-col input').val($('.last-updated-col input').val().split(" ")[0]);
    $('.print-date input').val(new Date().toLocaleString());
  });

  $(document).on('lookupcomplete', function (e) {
    console.log('Purchase Order Print Loaded');



  });

});