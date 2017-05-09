$(document).ready(function(){

    // function to show our popups
    function showPopup(whichpopup){
        var docHeight = $(document).height(); //grab the height of the page
        var scrollTop = $(window).scrollTop(); //grab the px value from the top of the page to where you're scrolling
        $('.overlay-bg').show().css({'height' : docHeight}); //display your popup background and set height to the page height
        $('.popup'+whichpopup).show().css({'top': scrollTop+20+'px'}); //show the appropriate popup and set the content 20px from the window top
    }

    // function to close our popups
    function closePopup(){
        $('.overlay-bg, .overlay-content').hide(); //hide the overlay
    }

    // timer if we want to show a popup after a few seconds.
    //get rid of this if you don't want a popup to show up automatically
    setTimeout(function() {
        // Show popup3 after 2 seconds
        showPopup(3);
    }, 2000);


    // show popup when you click on the link
    $('.show-popup').click(function(event){
        event.preventDefault(); // disable normal link function so that it doesn't refresh the page
        var selectedPopup = $(this).data('showpopup'); //get the corresponding popup to show
        
        showPopup(selectedPopup); //we'll pass in the popup number to our showPopup() function to show which popup we want
    });
  
    // hide popup when user clicks on close button or if user clicks anywhere outside the container
    $('.close-btn, .overlay-bg').click(function(){
        closePopup();
    });
    
    // hide the popup when user presses the esc key
    $(document).keyup(function(e) {
        if (e.keyCode == 27) { // if user presses esc key
            closePopup();
        }
    });
});