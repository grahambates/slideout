/**
 * Slideout jQuery plugin
 *
 * @author Graham Bates <hello@grahambates.com>
 */
(function ($) {
  "use strict";

  var initialized = false,

    // Cached elements.
    $root,
    $page,
    $loading,
    $content,
    $inner,
    $caption,
    $navigation,
    $count,
    $prev,
    $next,
    $currentSlide,

    // Current open link.
    href,

    // Open state.
    open = false,

    // Default settings.
    defaults = {
      rootElement: "body",
      previous: "Previous",
      next: "Next",
      close: "Close",
      loading: "Loading…",
      removeDelay: 1000,
      transition: true,
      transitionOnOpen: false,
      keyboard: true,
      loop: true,
      onOpen: false,
      onLoad: false,
      onClose: false
    },

    // Loaded settings.
    settings,

    // Public methods.
    methods = [];

  // Add elements to DOM.
  function init(options) {
    var markup;

    if (initialized) {
      return;
    }

    settings = $.extend({}, defaults, options);

    markup = '<div class="slideout-content">';
    markup += '<div class="slideout-content-loading">' + settings.loading + '</div>';
    markup += '<div class="slideout-content-inner"></div>';
    markup += '<div class="slideout-content-caption"></div>';
    markup += '<div class="slideout-content-controls">';
    markup += '<span class="slideout-content-navigation">';
    markup += '<span class="slideout-content-count"></span>';
    markup += '<a class="slideout-content-prev" href="#">' + settings.previous + '</a>';
    markup += '<a class="slideout-content-next" href="#">' + settings.next + '</a>';
    markup += '</span>';
    markup += '<a class="slideout-content-close" href="#">' + settings.close + '</a>';
    markup += '</div>';
    markup += '</div>';

    $root = $(settings.rootElement);
    $root.wrapInner('<div class="slideout-page" />').prepend(markup);

    $page = $('.slideout-page');
    $loading = $('.slideout-content-loading');
    $content = $('.slideout-content');
    $inner = $('.slideout-content-inner');
    $caption = $('.slideout-content-caption');
    $navigation = $('.slideout-content-navigation');
    $count = $('.slideout-content-count');
    $prev = $('.slideout-content-prev');
    $next = $('.slideout-content-next');

    $navigation.hide();
    $content.click(methods.open);

    $('.slideout-content-close').click(function (e) {
      methods.close();
      e.preventDefault();
      e.stopPropagation();
    });

    // Key Bindings
    if (settings.keyboard) {
      $(document).bind('keydown.slideout', function (e) {
        if (open) {
          if (e.keyCode === 27) {
            e.preventDefault();
            methods.close();
          } else if (e.keyCode === 37) {
            e.preventDefault();
            $prev.click();
          } else if (e.keyCode === 39) {
            e.preventDefault();
            $next.click();
          }
        }
      });
    }

    initialized = true;
  }

  function trigger(event, callback) {
    $.event.trigger(event);
    if (callback) {
      callback.call($content);
    }
  }

  function isImage(href) {
    return (/\.(gif|png|jp(e|g|eg)|bmp|ico)((#|\?).*)?$/i).test(href);
  }

  methods.destroy = function () {
    initialized = false;
    href = null;
    $content.remove();
    $('.slideout-page > *').unwrap();
  };

  // Open slideout.
  methods.open = function () {
    if (!open) {
      $root.addClass('slideout-open');
      open = true;
      setTimeout(function () {
        $page.click(methods.close);
        $content.unbind('click', methods.open);
      }, 500);
      trigger('slideout_open', settings.onOpen);
    }
  };

  // Close slideout.
  methods.close = function () {
    $root.removeClass('slideout-open');
    $page.unbind('click', methods.close);
    $content.click(methods.open);
    open = false;
    trigger('slideout_close', settings.onClose);
  };

  // Load content from href.
  methods.load = function (options) {
    var loading,
      currentIndex,
      countText,
      prevItem,
      nextItem,
      $newSlide,
      $photo;

    init(options);

    // Avoid reloading existing content.
    if (href !== options.href) {
      href = options.href;

      // Transition out existing slides.
      $('.slideout-slide').removeClass('is-in').addClass('is-out');

      // Add new slide.
      $newSlide = $('<div class="slideout-slide" />');
      $inner.append($newSlide);

      // Load content into slide:
      if (href.indexOf('#') === 0) {
        // On page content.
        $newSlide.html($(href).html());
        $loading.hide();
        // Needs delay to trigger transition.
        setTimeout(function () {
          $newSlide.addClass('is-in');
        }, 1);
      } else if (isImage(href)) {
        // Image link.
        $loading.show();
        $photo = $(new Image());
        $photo.load(function () {
          $loading.hide();
          $newSlide.addClass('is-in');
        });
        $newSlide.append($photo);
        setTimeout(function () {
          $photo.attr('src', href);
        }, 1);
      } else {
        // AJAX.
        $loading.show();
        $newSlide.load(href, {success: function () {
          $loading.hide();
          $newSlide.addClass('is-in');
        }});
      }

      // Remove old slide once transition is finished and update reference.
      if ($currentSlide) {
        setTimeout(function () {
          $currentSlide.remove();
          $currentSlide = $newSlide;
        }, settings.removeDelay);
      } else {
        $currentSlide = $newSlide;
        $newSlide.addClass('no-transition');
      }

      if (!settings.transition ||
          (!settings.transitionOnOpen && !open)) {
        $newSlide.addClass('no-transition');
      }

      trigger('slideout_load', settings.onLoad);
    }

    // Add caption.
    if (options.caption) {
      $caption.show().text(options.caption);
    } else {
      $caption.hide();
    }

    // Check if we need navigation.
    if (options.sequence && options.sequence.length > 1) {
      $('.slideout-content-navigation').show();

      // Find current item in sequence.
      $(options.sequence).each(function (i, item) {
        if (item.href === href) {
          currentIndex = i;
        }
      });

      // Update position/total.
      countText = (currentIndex + 1) + ' of ' + options.sequence.length;
      $count.html(countText);

      // Disable existing navigation links.
      $prev.addClass('is-disabled').unbind('click');
      $next.addClass('is-disabled').unbind('click');

      // Previous link.
      if (currentIndex > 0 || settings.loop) {
        if (currentIndex === 0) {
          prevItem = options.sequence[options.sequence.length - 1];
        } else {
          prevItem = options.sequence[currentIndex - 1];
        }
        prevItem.sequence = options.sequence;
        if (isImage(prevItem.href)) {
          new Image().src = prevItem.href;
        }
        $prev.removeClass('is-disabled').click(function (e) {
          methods.load(prevItem);
          e.preventDefault();
        });
      }

      // Next link.
      if (currentIndex < options.sequence.length - 1 || settings.loop) {
        if (currentIndex >= options.sequence.length - 1) {
          nextItem = options.sequence[0];
        } else {
          nextItem = options.sequence[currentIndex + 1];
        }
        nextItem.sequence = options.sequence;
        if (isImage(nextItem.href)) {
          new Image().src = nextItem.href;
        }
        $next.removeClass('is-disabled').click(function (e) {
          methods.load(nextItem);
          e.preventDefault();
        });
        if ($photo) {
          $photo.click(function (e) {
            if (open) {
              methods.load(nextItem);
            }
          });
        }
      }
    } else {
      $navigation.hide();
    }
  };

  // Initialize open links.
  $.fn.slideout = function (options) {
    init(options);

    return $(this).each(function (i, item) {
      var rel = $(item).attr('rel'),
        loadOptions = {
          href: $(item).attr('href'),
          caption: $(item).attr('title'),
          sequence: []
        };

      // Get sequence from related links.
      if (rel) {
        $('a[rel=' + rel + ']').each(function () {
          loadOptions.sequence.push({
            href: $(this).attr('href'),
            caption: $(this).attr('title')
          });
        });
      }

      $(item).click(function (e) {
        methods.load(loadOptions);
        methods.open(options);
        e.preventDefault();
        e.stopPropagation();
      });
    });
  };

  // Call public methods.
  $.slideout = function (method, options) {
    if (methods[method]) {
      methods[method](options);
    } else {
      $.error('Method ' +  method + ' does not exist on jQuery.slideout');
    }
  };
}(jQuery));

