function Slider(opts) {
    $.extend(this, opts);
    this.init();
}

$.extend(Slider.prototype, {
    //Options
    sliderSelector: '.slider',
    loop: true,
    animationDuration: 500,
    arrows: true,
    preview: false,
    pagination: true,
    autoPlay: false,
    autoPlayInterval: 500,
    direction: 'horizontal',
    animationType: 'default',

    //Properties
    index: 0,
    isMoving: false,
    autoPlayerCounter: null,
    dimension: 'width',
    axis: 'X',

    LEFT_ARROW_CODE: 37,
    UP_ARROW_CODE: 38,
    RIGHT_ARROW_CODE: 39,
    DOWN_ARROW_CODE: 40,
    
	init() {
        this.$el = $(this.sliderSelector);
        this.$el.addClass(`${this.direction}`);
        this.$viewport = this.$el.find('.slider__viewport');
        this.$slides = this.$viewport.children();
        
        this.viewportSwipe = new Hammer(this.$viewport[0]);
        this.viewportTransition = `transform ${this.animationDuration / 1000}s`;

        if (this.direction === 'vertical') {
            this.dimension = 'height';
            this.axis = 'Y';
        }
   
        this.setupSize();
        
        if (this.autoPlay) {
            this.loop = true;
            this.setAutoPlayer();
        }

		if (this.arrows) {
			this.renderArrows();
        }
        
        if (this.preview) {
            this.renderPreview();
            this.$el.addClass('previewable');
        } else if (this.pagination) {
            this.renderPagination();
        }

        this.addListeners();
        this.updateControls(this.index);
    },

    addListeners() {
        $(window)
            .on('resize orientationchange', this.setupSize.bind(this))
            .keydown(this.keyDownHandler.bind(this));

        this.viewportSwipe
            .on('pan', this.viewportPanHandler.bind(this))
            .get('pan')
            .set({ direction: Hammer[`DIRECTION_${this.direction.toUpperCase()}`] });

        if (this.arrows) {
            this.$el.find(`.arrow-prev`).click(this.movePrev.bind(this));
            this.$el.find(`.arrow-next`).click(this.moveNext.bind(this)); 
        }

        if (this.pagination) {
            this.$el.find(`.pagination-btn`).click(this.paginationClickHandler.bind(this));
        }

        if (this.preview) {
            this.$el.find(`.preview-img`).click(this.paginationClickHandler.bind(this));
            this.previewSwipe
                .on('pan', this.previewPanHandler.bind(this))
                .get('pan')
                .set({ direction: Hammer[`DIRECTION_${this.direction.toUpperCase()}`] });
        }

        this.$viewport.on('transitionend', () => {
            this.$el.trigger({ 
                type: "slideChanged", 
                emitter: this.$el, 
                time: new Date(),
            })
        });
    },

    updateControls(index) {
        if (!this.loop) {
            const hasPrev = index === 0,
                  hasNext = index === this.$slides.length - 1;

            this.$el.find(`.arrow-prev`).css('display', hasPrev ? 'none' : 'block');
            this.$el.find(`.arrow-next`).css('display', hasNext ? 'none' : 'block');
        }

        if (this.preview) {
            const step = this.$el.find(`.preview-img`)[0][this.dimension],
                  scrollPos = step * (index - 1.5);

            this.$previewPanel.scrollTo(scrollPos, this.animationDuration);

            this.$el.find(`.preview-img`).removeClass('preview-img_active');
            this.$el.find(`img[data-index=${index}]`).addClass('preview-img_active');
        }
        
        if (this.pagination) {
            this.$el.find(`.pagination-btn`).removeClass('pagination-btn_active');
            this.$el.find(`div[data-index=${index}]`).addClass('pagination-btn_active');
        }
    },

    setAutoPlayer() {
        this.autoPlayerCounter = setInterval( 
            () => this.moveNext(), 
            this.autoPlayInterval
        );
    },

    setupSize() {
        this.baseSize = this.$el.find('.slider__wrapper')[this.dimension]();

        this.$viewport
            .css(this.dimension, `${this.baseSize * this.$slides.length}px`)
            .children()
                .css(this.dimension, `${this.baseSize}px`);

        this.translateViewport(this.index * this.baseSize, false);        
    },

    renderArrows() {
        $('<div/>', { class: `arrow-prev` })
            .appendTo(this.$el.find('.slider__wrapper'));
        $('<div/>', { class: `arrow-next` })
            .appendTo(this.$el.find('.slider__wrapper'));
    },

    renderPagination() {
        const paginationPanel = $('<div/>', { 
                class: `pagination-panel`
            }).appendTo(this.$el.find('.slider__wrapper'));

        _.each(this.$slides, (slide, counter) => {
            $('<div/>', { 
                class: 'pagination-btn',
                'data-index': counter
            }).appendTo(paginationPanel);
        });
    },

    viewportPanHandler(pan) {
        const delta = pan[`delta${this.axis}`],
              startPoint = this.index * this.baseSize,
              endPoint = startPoint - delta,

              moveTo = delta < 0 ? 'moveNext' : 'movePrev',
              shouldMove = Math.abs(delta) > this.baseSize / 5;

        this.translateViewport(endPoint, false);

        if (shouldMove) {

            if (this[moveTo]() === false) {
                this.translateViewport(startPoint);
            }

            this.viewportSwipe.stop();
        } else if (pan.isFinal) {
            this.translateViewport(startPoint);
        }
    },

    translateViewport(pos, time = this.viewportTransition) {
        this.$viewport
            .css('transition', time)
            .css('transform', `translate${this.axis}(${-pos}px)`);
    },

    previewPanHandler(pan) {
        const deltaSign = Math.sign(pan[`delta${this.axis}`]),
              step = 10 * deltaSign,
              direction = this.direction == 'horizontal' ? 'scrollLeft' : 'scrollTop',
              startPoint = this.$previewPanel[0][direction];

        this.$previewPanel.scrollTo(startPoint - step);
    },

    keyDownHandler(key) {
		if (
			key.keyCode === this.LEFT_ARROW_CODE ||
			key.keyCode === this.UP_ARROW_CODE
		) {
			this.movePrev();
		} else if (
			key.keyCode === this.RIGHT_ARROW_CODE ||
			key.keyCode === this.DOWN_ARROW_CODE
		) {
			this.moveNext();
		}
    },

    movePrev(e) {
        if (!this.loop && !this.index) return false;

        const index = this.index === 0 ? this.$slides.length - 1 : this.index - 1;

        this.moveToSlide(index);
    },

    moveNext(e) {
        if (!this.loop && this.index === this.$slides.length - 1) return false;

        const index = this.index === this.$slides.length - 1 ? 0 : this.index + 1;

        this.moveToSlide(index);
    },

    paginationClickHandler(click) {
        const index = +$(click.target).attr('data-index');

        this.moveToSlide(index);
    },

    renderPreview() {
        this.$previewPanel = $('<div/>', { 
            class: `preview-panel`
        }).appendTo(this.$el.find('.slider__wrapper'));

        const previewUnit = $('<div/>', {
            class: 'preview-viewbox' 
        }).appendTo(this.$previewPanel);

        _.each(this.$slides, (slide, counter) => {
            $('<img/>', { 
                class: 'preview-img',
                src: $(slide).children('img')[0].src,
                'data-index': counter
            }).appendTo(previewUnit);
        });

        this.previewSwipe = new Hammer(this.$previewPanel[0]);
    },

    animateCustom(type) {
        let fadeDuration = this.animationDuration / 2,
            fadeOutProps = {},
            fadeInProps = {};

        switch (type) {
            case 'transparency':
                fadeOutProps = {
                    opacity: '0.2'
                };
                fadeInProps = {
                    opacity: '1'
                };
                break;
            case 'scaling':
                fadeOutProps = {
                    marginTop: '2.5%',
                    marginLeft: '40%',
                    height: '20%',
                    width: '20%'
                };
                fadeInProps = {
                    marginTop: '0',
                    marginLeft: '0',
                    height: '100%',
                    width: '100%'
                };
                break;
            default:
                console.log('undefined animation type');
                return false;
        }

        this.$slides.animate(
            fadeOutProps,
            fadeDuration,
            function() {
                $(this).animate(
                    fadeInProps,
                    fadeDuration
                );
            }
        );
    },

    moveToSlide(index) {
        if (this.index === index) return;

        this.index = index;

        if (this.animationType !== 'default') {
            this.animateCustom(this.animationType);
        }

        this.translateViewport(index * this.baseSize)

        this.updateControls(index);
    }
});


//$(document).on("slideChanged", slideChangedHandler);

function slideChangedHandler(event) {
	console.log(
		[
			`HI! I'm User's callback. It's`,
			` ${event.time.getHours()}`,
			`:${event.time.getMinutes()}`,
            `:${event.time.getSeconds()} o'clock`
		].join("")
	);
}

sliderOpts = {
    sliderSelector: '#slider',
    loop: false,
    arrows: true,
    pagination: true,
    preview: true,
    autoPlay: false,
    autoPlayInterval: 500,
    animationType: 'scaling', // 'default' , 'transparency', 'scaling'
    direction: 'horizontal', // 'horizontal' 'vertical'
};

const dynamicOpts = JSON.parse(localStorage.getItem(`dynamicOpts`)) || {},
      $controls = $('.controls');

$.each(dynamicOpts, (key, val) => {
    $controls.find(`.${key} :contains(${val})`).addClass('on');
});

$controls.find('p').click(ev => {
    $(ev.currentTarget)
        .children()
        .toggleClass('on');
});

$('.hideControls').click(() => {
    $controls.toggleClass('hidden');
});

$('.reload').click(() => {
	localStorage.setItem(
		"dynamicOpts",
		JSON.stringify({
			direction: $(".direction .on").text(),
			loop: $(".loop .on").text() === "true" ? true : false,
			arrows: $(".arrows .on").text() === "true" ? true : false,
			pagination: $(".pagination .on").text() === "true" ? true : false,
			preview: $(".preview .on").text() === "true" ? true : false
		})
	);

	location.reload();
});

$.extend(sliderOpts, dynamicOpts);

const slider = new Slider(sliderOpts);

