/*
 * situZoom
 *
 *
 * Copyright (c) 2014 John McCormick
 * Licensed under the MIT license.
 *
 * Special thanks to Examiner.com for supporting this project.
 *
 * You must provide a valid DOCTYPE declaration (e.g., <!DOCTYPE HTML>) for this script to work.
 */

;(function ($, window, document, undefined) {
  "use strict";

  $.fn.situZoom = function (options) {
    var defaults = {
        captionClass: 'caption',
        maxSize: 1,
        onZoomReady: function () { },
        onZoomFinished: function () { },
        onZoomLoaded: function () { },
        onZoomRemoved: function () { },
        onZoomStarted: function () { },
        onZoomZoomed: function() { },
        onZoomCloseStarted: function() { },
        showTitles: true,
        speed: '0.25s',
        viewportPadding: 0,
        zIndex: 99999999999,
        zoomedClass: 'zoomified'
      },
      settings = $.extend({}, defaults, options),
      $thumbnail = {},
      $enlargement = {},
      enlargedRatio,
      instanceNumber = 0,
      ratio,
      viewport = {},
      direction = {},
      instances = [];

    this.closeAll = closeAll;
    this.close = close;

    // Iterate over all activated thumbnails.
    return this.each( function () {
      instances.push(this);
      $(this).attr('data-index', instanceNumber);
      instanceNumber++;

      if (!$(this).is('img')) {
        return;
      }

      // Ensure the image thumbnail has fully loaded.
      $(this).one('load', function (event) {
        $(event.currentTarget).click(buildEnlargement);
      }).each(checkload);
    });

    function buildEnlargement(event) {
      event.preventDefault();
      if (typeof settings.onZoomStarted === 'function') {
        settings.onZoomStarted.call(event);
      }
      $thumbnail = $(event.currentTarget);

      // Build the jQuery enlargement image DOM element.
      $enlargement = $("<img />").attr({
        'src': $thumbnail.data('large'),
        'class': settings.zoomedClass,
        'title': $thumbnail.attr('title')
      });

      $enlargement.one('load', processEnlargement).each(checkload);
    }

    function processEnlargement(event) {
      var $zoomedImage = $( event.currentTarget),
        offset = {};

      $enlargement.width = $zoomedImage[0].width;
      $enlargement.height = $zoomedImage[0].height;

      viewport = calculateViewport();
      $thumbnail = $.extend({}, $thumbnail, calculateThumbnailPosition());
      direction = calculateEnlargementDirection();
      offset = calculateOffset();

      if ($enlargement.parent() !== undefined) {
        $enlargement.wrap('<figure></figure>');
      }

      $enlargement.parent('figure').css({
        'margin': 0,
        'padding': 0,
        'left': $thumbnail.xPos - offset.x,
        'top': ($thumbnail.yPos + viewport.scrollTop) - offset.y,
        'position': 'absolute',
        'z-index': 10
      });

      scaleEnlargementToThumbnail();
      calculateEnlargementRatio();
      if (typeof settings.onZoomLoaded === 'function') {
        settings.onZoomLoaded.call(event.currentTarget );
      }

      $zoomedImage.parent('figure').css({
        'cursor':               'pointer',
        'position':             'absolute',
        'z-index':              settings.zIndex,
        '-ms-transform':         'scale(' + enlargedRatio + ') ',
        '-webkit-transform':     'scale(' + enlargedRatio + ') ',
        'transform':            'scale(' + enlargedRatio + ') ',
        'backface-visibility':  'hidden'
      });

      $zoomedImage.css('display', 'block');
      $thumbnail.addClass('zoomed');
      $zoomedImage.parent('figure').bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", addCaption);

      // Add close Click Handler.
      $zoomedImage.parent('figure').click(closeEnlargement);
      if (typeof settings.onZoomFinished === 'function') {
        settings.onZoomFinished.call(event.currentTarget);
      }
    }

    function addCaption(event) {
      var $transitionedEnlargement = $(event.currentTarget);
      $transitionedEnlargement.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");

      if (typeof settings.onZoomFinished === 'function') {
        settings.onZoomZoomed.call(event);
      }

      // If a title attribute is present and showTitles is flagged, then show the title.
      if ($enlargement.attr('title') && settings.showTitles) {

        $enlargement.parent('figure').append('<figcaption class="' + settings.captionClass + '">' + $enlargement.attr('title') + '</figcaption>');
        $enlargement.parent('figure').find('figcaption').css({
          'position': 'absolute',
          'bottom': 0,
          'width': ($enlargement.width * enlargedRatio),
          '-ms-transform': 'scale(' + (1 / enlargedRatio) + ')',
          '-webkit-transform': 'scale(' + (1 / enlargedRatio) + ')',
          'transform': 'scale(' + (1 / enlargedRatio) + ')',
          '-ms-transform-origin': 'left bottom',
          '-webkit-transform-origin': 'left bottom',
          'transform-origin': 'left bottom'
        });
      }
    }

    /**
     * Close an indexed zoomable item.
     *
     * @param index
     */
    function close(index) {
      var $element = $('.zoomable[data-index=' + index + ']');
      closeEnlargement($element);
    }

    /**
     * Close all Zoomable items
     */
    function closeAll() {
      $.each(instances, function (index, element) {
        closeEnlargement(element);
      });
    }


    function closeEnlargement(element) {
      var $element = element.currentTarget ? $('.zoomable[data-index=' + $(element.currentTarget).attr('data-index') + ']') : $(element);
      var elementIndex = $element.attr('data-index');
      var $closedEnlargement = $('.enlargement-zoomed[data-index=' + elementIndex + ']');
      ratio = $closedEnlargement.data('ratio');

      $closedEnlargement.find('figcaption').remove();
      $closedEnlargement.css({
        '-ms-transform':  'scale(' + ratio + ')',
        '-webkit-transform': 'scale(' + ratio + ')',
        'transform': 'scale(' + ratio + ')'
      });

      if (typeof settings.onZoomCloseStarted === 'function') {
        settings.onZoomCloseStarted.call(event);
      }

      $closedEnlargement.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
        $(this).remove();
        $('.zoomed').removeClass('zoomed');
        if (typeof settings.onZoomRemoved === 'function') {
          settings.onZoomRemoved.call(this);
        }
      });
    }

    function calculateViewport() {
      return {
        scrollTop: $(window).scrollTop(),
        width: $(window).width(),
        height: $(window).height()
      };
    }

    function calculateThumbnailPosition() {
      return {
        xPos: $thumbnail.offset().left,
        yPos: $thumbnail.offset().top - viewport.scrollTop
      };
    }

    function calculateEnlargementDirection() {
      return {
        x: $thumbnail.xPos + ($thumbnail.width() / 2) < (viewport.width / 2) ? 'left' : 'right',
        y: $thumbnail.yPos + ($thumbnail.height() / 2)  < (viewport.height / 2) ? 'top' : 'bottom'
      }
    }

    function calculateOffset() {
      return {
        x: direction.x === 'right' ? $enlargement.width - $thumbnail.width() : 0,
        y: direction.y === 'bottom' ? $enlargement.height - $thumbnail.height() : 0
      }
    }

    function scaleEnlargementToThumbnail() {
      ratio = $thumbnail.width() / $enlargement.width;

      $enlargement.parent('figure').css({
        'transition': 'all ' + settings.speed,
        '-ms-transform': 'scale(' + ratio + ')',
        '-webkit-transform': 'scale(' + ratio + ')',
        'transform': 'scale(' + ratio + ')',
        '-ms-transform-origin': (direction.x + ' ' + direction.y),
        '-webkit-transform-origin': (direction.x + ' ' + direction.y),
        'transform-origin': (direction.x + ' ' + direction.y)
      });

      $enlargement.parent('figure').addClass('enlargement-zoomed');
      $enlargement.parent('figure').attr('data-y-direction', direction.y);
      $enlargement.parent('figure').attr('data-x-direction', direction.x);
      $enlargement.parent('figure').attr('data-ratio', ratio);
      $enlargement.parent('figure').attr('data-index', $thumbnail.attr('data-index'));

      $('body').prepend($enlargement.parent('figure'));
      $enlargement.focus(); // Allows transition to activate on item.
    }

    function calculateEnlargementRatio() {
      viewport.maxHeight = direction.y === 'bottom' ?
        ($thumbnail.yPos + $thumbnail.height()) - settings.viewportPadding : //bottom
        viewport.height - $thumbnail.yPos - settings.viewportPadding; // top

      viewport.maxWidth = direction.x === 'left' ?
        viewport.width - $thumbnail.xPos - settings.viewportPadding : //left
        ($thumbnail.xPos + $thumbnail.width()) - settings.viewportPadding; //right

      enlargedRatio = Math.min(viewport.maxHeight / $enlargement.height, viewport.maxWidth / $enlargement.width);
    }

    function checkload(event) {
      if (this.complete) {
        $(this).load();
      }
    }
  };


})(jQuery, this, this.document);
