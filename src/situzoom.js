/*
 * situZoom
 *
 *
 * Copyright (c) 2014 John McCormick
 * Licensed under the MIT license.
 */

;(function ($, window, document, undefined) {
  $.fn.situZoom = function ( options ) {

    var defaults = {
        maxSize: 1,
        onZoomed: function () {},
        onZoomLoaded: function () {},
        onZoomRemoved: function () {},
        showTitles: true,
        speed: '0.25s',
        viewportPadding: 10,
        zIndex: 99999999,
        zoomClass: 'zoomified'
      },

      settings = $.extend( {}, defaults, options );

    this.each(function () {
      var $thumbnail,
        $enlargement,
        maxWidth,
        maxHeight,
        ratio,
        viewport = {},
        xDirection,
        yDirection,
        enlargedRatio;

      // Click handler for all images with .zoomable class.
      $(this).click(function (event) {

        event.preventDefault();
        $thumbnail = $(this);

        // Build the jQuery enlarged image DOM element.
        $enlargement = $("<img />").attr({'src': $thumbnail.data('large'), 'class': 'zoomify-enlargement', 'title': $thumbnail.attr('title')});
        $enlargement.one('load', function () {
          var $zoomedImage = $(this);

          calculateThumbnailValues($thumbnail);
          placeEnlargement(this);
          calculateEnlargementRatio();
          settings.onZoomLoaded.call( this );

          $zoomedImage.css({
            'cursor': 'pointer',
            'position': 'absolute',
            'z-index': settings.zIndex,
            'transform': 'scale(' + enlargedRatio + ') ',
            'backface-visibility': 'hidden'
          });

          $zoomedImage.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){
            var $transitionedEnlargement = $(this);
            $transitionedEnlargement.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
            $transitionedEnlargement.wrap('<figure></figure>');
            if ($transitionedEnlargement.attr('title')) {
              $transitionedEnlargement.parent('figure').append('<figcaption>' + $(this).attr('title') + '</figcaption>');
            }
            settings.onZoomed.call( this );
          });

            // Add close clickhandler.
          $zoomedImage.click(function () {
            $(this).css('transform', 'scale(' + ratio + ')');
            $(this).bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){
              $(this).parent('figure').remove();
              $('.zoomed').removeClass('zoomed');
              settings.onZoomRemoved.call( this );
            });
          });

          $thumbnail.addClass('zoomed');

          logValues();


        }).each(function() {
            if (this.complete) $(this).load();
          });
      });






      // Calculate values
      function calculateThumbnailValues($image) {
        viewport.scrollTop =   $(window).scrollTop();
        viewport.width =       window.innerWidth;
        viewport.height =      window.innerHeight;
        $thumbnail.xPos =      $thumbnail.offset().left;
        $thumbnail.yPos =      $thumbnail.offset().top;
        $thumbnail.width =     $thumbnail.width();
        $thumbnail.height =    $thumbnail.height();
        xDirection =           $thumbnail.xPos < (viewport.width / 2) ? 'left' : 'right';
        yDirection =           ($thumbnail.yPos - viewport.scrollTop + $thumbnail.height / 2) < (viewport.height / 2) ? 'top' : 'bottom';
      }

      // Place the loaded enlargement directly over thumbnail, scaled to match.
      function placeEnlargement(obj) {

        $enlargement.width =    obj.width;
        $enlargement.height =   obj.height;
        ratio =                 $thumbnail.width / $enlargement.width;
        var xOffset =           xDirection == 'right' ? $enlargement.width - $thumbnail.width : 0;
        var yOffset =           yDirection == 'bottom' ? $enlargement.height - $thumbnail.height : 0;

        $enlargement.css({
          'left':                 $thumbnail.xPos - xOffset,
          'top':                  $thumbnail.yPos - yOffset,
          'position':             'absolute',
          'transition':           'all ' + settings.speed,
          'transform':            'scale(' + ratio + ')',
          'transform-origin':     (xDirection + ' ' + yDirection),
        });
        $('body').prepend($enlargement);
        $enlargement.focus(); // Allows transition to activate on item.
      }

      function calculateEnlargementRatio() {
        maxHeight = yDirection == 'bottom' ? (($thumbnail.yPos - viewport.scrollTop) + $thumbnail.height) - settings.viewportPadding : ($thumbnail.yPos ) - settings.viewportPadding;
        maxWidth = xDirection == 'left' ? viewport.width - $thumbnail.xPos - settings.viewportPadding : $thumbnail.xPos - settings.viewportPadding;

        // Compare the maxWidth and smallWidth and choose the small of the two
        enlargedRatio = maxHeight <= maxWidth ? maxHeight / $enlargement.height : maxWidth / $enlargement.width;
      }

      function logValues() {
        console.table([
          {
            'viewport.width': viewport.width,
            'viewport.height': viewport.height,
            'viewport.scrollTop': viewport.scrollTop,
            'xPos': $thumbnail.xPos,
            'yPos': $thumbnail.yPos,
            'maxWidth': maxWidth,
            'maxHeight': maxHeight,
            '$thumbnail.height': $thumbnail.height,
            '$thumbnail.width': $thumbnail.width,
            '$enlargement.width':$enlargement.width,
            '$enlargement.height':$enlargement.height,
            'xDirection': xDirection,
            'yDirection': yDirection,
            'enlargedRatio': enlargedRatio,
          }
        ]);
      }

    });
  }

})(jQuery, this, this.document);
