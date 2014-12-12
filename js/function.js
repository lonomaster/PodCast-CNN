/*
 * RSS Feed Controller
 */
function rss(){
	
	
	
	
	var data = false;
	
	
	function init(p_callback){
		
		//Google Feed API on load event
	    google.setOnLoadCallback(function(){readRSS(p_callback);});
	}
	
	function readRSS(p_callback){
		
		var feed = new google.feeds.Feed( URL_RSS );
		feed.setNumEntries( NUM_ENTRIES );
		
      	feed.load(function(result) {
	    	  
	        if (!result.error) {
	        	
	        	window.console.log(result);
	        	
	        	data = result;
	        	
	        	if (p_callback && typeof p_callback === 'function'){
	        		
	        		p_callback(data);
	        	}
	        }
	        else {
	        	window.console.error('Error getting RSS data');
	        }
      	}); 	
	}
	
	function get(){
		
		return data;
	}
	
	this.get = get;
	this.init = init;
	
	return this;
}
/*
 *  Carousel Controller
 */
function carouselController(){
	
	var   TEMPLATES_PATH = 'templates/'
		, TEMPLATES = {
			CAROUSEL_ITEM: {
				  NAME: 'carousel-item-template'
				, PATH: TEMPLATES_PATH + 'carousel-item.html'
			}
		}
		, NUM_ITEMS = 4
	;
	
	
	var $carousel
	  ,	$list
	  , $upBtn
	  , $downBtn
	  , selected = null
	  , last = 0
	  , lastVisible
	  , firstVisible
	;
	
	function init(){
		
		$carousel = $('#carousel');
		$list = $('#carousel-list');
		$upBtn = $('#prev-btn');
		$downBtn = $('#next-btn');
	}
	
	/*
	 * Create carousel with jCarousel plugin
	 */
	function createCarousel(){
		
		var carouselHeight = $list.find('li').outerHeight(true) * NUM_ITEMS;
		
		$carousel.height(carouselHeight);

		$carousel.jcarousel({
		    'vertical': true,
		    scroll: 1,
		    size: carouselHeight
		});
	    
	    //Set number of items and visible elements
	    last = $list.find('li').length -1;
	    firstVisible = 0;
	    lastVisible = NUM_ITEMS - 1;
	    
	    //Select first item
	    select(0);
	}

	
	function select(pos){
		
		if (selected != null){
			getSelectedItem().removeClass('selected');	
		}
		selected = pos;
		getSelectedItem().addClass('selected');
	}
	
	function getSelectedItem(){
		
		if (selected == 'up'){
			return $upBtn;
		}
		else if (selected == 'down'){
			return $downBtn;
		}
		else{
			return $list.find('li').eq(selected);
		} 
		
	}
	
	function inflate(data){
		
		$.get(TEMPLATES.CAROUSEL_ITEM.PATH, function(templates) { 

		    var template = $(templates).filter('#' + TEMPLATES.CAROUSEL_ITEM.NAME).html();
		    $.each(data, function(i,e){
		    	
		    	$list.append(Mustache.render(template, e));
		    	
		    	var item = $list.children().last();
		    	item.data('description', e.contentSnippet);
		    	item.data('link', e.link);
		    })
		    
		    createCarousel();
		});
	}
	
	function play(){

		var link = getSelectedItem().data('link');
		var description = getSelectedItem().data('description');
		
		player.video.inflate(link, description);
		player.video.play();
	}
	
	
	function enter(){
		
		if (selected == 'up'){
			if (firstVisible != 0){
				--firstVisible;
				--lastVisible;
			}
			$carousel.jcarousel('scroll', '-=1');
		}
		else if (selected == 'down'){
			if (lastVisible != last){
				++firstVisible;
				++lastVisible;
			}
			$carousel.jcarousel('scroll', '+=1');
		}
		else {
			play();
		}
	}
	
	function up(){
		switch (selected){
			
			case 'up': break;
			case 'down': select(lastVisible); break;
			case firstVisible: select('up'); break;
			default: select(selected-1); break;
		}
	}
	
	function down(){
		switch (selected){
			
			case 'up': select(firstVisible); break;
			case 'down': break;
			case lastVisible: select('down'); break;
			default: select(selected+1); break;
		}
	}
	
	this.init = init;
	this.inflate = inflate;
	this.up = up;
	this.down = down;
	this.enter = enter;
	
	return this;
}



/*
 * Keypad Controller
 */
function keyController(){
	
	function init(){
		
		$(document).on('keydown', function(e){
			move(e);
		});
	}
	
	function getKeyCode(e){
		
		var keycode = null;
		
	    if(window.event) {
	        keycode = window.event.keyCode;
	    }
	    else if(e) {
	        keycode = e.which;
	    }
	    
	    return keycode;
	}
	
	function move(e){
		
		var keyCode = getKeyCode(e);
		keyMap(keyCode);
	}
	
	function keyMap(keyCode){
		
		if (keyCode == 38){
			player.carousel.up();
		}
		else if (keyCode == 40){
			player.carousel.down();
		}
		else if (keyCode == 13){
			player.carousel.enter();
		}
	}
	
	this.init = init;
	
	return this;
}


/*
 *  Player Controller
 */
function player(){
	
	var _this = this;
	
	_this.rss = null;
	_this.key = null;
	_this.carousel = null;
	_this.video = null;
	_this.$title = null;
	_this.$description = null;

	
	
	function init(){
		
		_this.rss = new rss();
		_this.key = new keyController();
		_this.carousel = new carouselController();
		_this.video = new video();
		_this.$title = $('#podcast-title');
		_this.$description = $('#podcast-description');

		_this.key.init();
		_this.carousel.init();
		_this.video.init();
		
		//Inflate player content with RSS data
		_this.rss.init( inflate );
	}
	
	function inflate(p_data){
		
		if (!p_data){
			
			window.console.error('No data.');
			return false;
		}
		
		var title = p_data.feed.title || 'No title';
		var description = p_data.feed.description || '';
		var items = p_data.feed.entries;
		
		//Inflate heading
		_this.$title.text( title );
		_this.$description.text( description );
		
		//Inflate carousel
		_this.carousel.inflate( items );
	}
	
	
	this.init = init;
	
	return this;
}


/*
 * Video Controller
 */
function video(){
	
	var   $video
		, $description
	;
	
	function init(){
		
		$video = $('#video');
		$description = $('#current-clip');
	}
	
	function inflate(link, description){
		
		$description.text(description);
		$video.attr("src", link);		
	}
	
	function play(){
		
		$video.get(0).play();
	}
	
	this.init = init;
	this.inflate = inflate;
	this.play = play;
	
	return this;
}