/**
 * main.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2016, Codrops
 * http://www.codrops.com
 */
;(function(window) {

	'use strict';

	function init() {
		[].slice.call(document.querySelectorAll('.nav')).forEach(function(nav) {
			var navItems = [].slice.call(nav.querySelectorAll('.nav__item')),
				itemsTotal = navItems.length,
				setCurrent = function(item) {
					// return if already current
					if( item.classList.contains('nav__item--current') ) {
						return false;
					}
					// remove current
					var currentItem = nav.querySelector('.nav__item--current');
					currentItem.classList.remove('nav__item--current');
					
					// set current
					item.classList.add('nav__item--current');
				};
			
			navItems.forEach(function(item) {
				item.addEventListener('click', function() { setCurrent(item); });
			});
		});

		[].slice.call(document.querySelectorAll('.link-copy')).forEach(function(link) {
			link.setAttribute('data-clipboard-text', location.protocol + '//' + location.host + location.pathname + '#' + link.parentNode.id);
			new Clipboard(link);
			link.addEventListener('click', function() {
				link.classList.add('link-copy--animate');
				setTimeout(function() {
					link.classList.remove('link-copy--animate');
				}, 300);
			});
		});

		var left = document.querySelector(".left");
		var right = document.querySelector(".right");
		var swipeBtn = document.querySelectorAll('.swipebtn');
		var backBtn = document.querySelector('.backbtn');
		var container = document.querySelector('.swipebox');
		const triggerElements = document.querySelectorAll('[data-toggle-visible]');
		const targetElements = document.querySelectorAll('[data-visible-target]');
		

		// ** Swipe ** //
		if (left && right && swipeBtn.length && container) {
			swipeBtn.forEach(function(swipeBtn) {
				swipeBtn.addEventListener('click', function() {
					container.classList.add('hover-right');
					container.classList.remove('hover-left');
				});
			});
			
			backBtn.addEventListener('click', function() {
				container.classList.add('hover-left');
				container.classList.remove('hover-right');
			});
		}

		// ** Show/ Hide ** //
		// Initialize all targets as hidden
		targetElements.forEach(el => {
			el.classList.remove('visible');
		});

		triggerElements.forEach(trigger => {
			trigger.addEventListener('click', function() {
				const targetId = this.getAttribute('data-toggle-visible');
				const target = document.querySelector(`[data-visible-target="${targetId}"]`);
				
				if (target) {
					target.classList.toggle('visible');
					
					// Optional: Close when clicking outside
					if (target.classList.contains('visible')) {
						document.addEventListener('click', function outsideClick(e) {
							if (!target.contains(e.target) && e.target !== trigger) {
								target.classList.remove('visible');
								document.removeEventListener('click', outsideClick);
							}
						});
					}
				}
			});
		});
		
	} init();

})(window);