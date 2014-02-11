var eventTiming = 9000, // Time between pane fade in ms (default 9 sec)
	numFeatPanes = 0,
	numEventPanes = 0,
	totalPanes,
	numNewsPanes,
	currentNewsPane,
	currentEventPane,
	featJSON = {},
	eventJSON = {},
	announceJSON = {},
	eventOffset = 0,
	eventCount,
	announceCount,
	urls = {"featured": "http://cows.ucdavis.edu/law/event/json?relStart=0&relEnd=0&display=lcd-feat",
		"events": "http://cows.ucdavis.edu/law/event/json?relStart=0&relEnd=0&display=lcd",
		"announcements": "http://cows.ucdavis.edu/law/announcement/json"},

	dateFormat = (function dateFormat() {
		var token = new RegExp("d{1,4}|D|m{1,4}|yy(?:yy)?|([HhMsTt])\\1?|[LloSZ]|\"[^\"]*\"|'[^']*'", "g"),
			timezone = new RegExp("\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\\d{4})?)\b", "g"),
			timezoneClip = new RegExp("[^-+\\dA-Z]", "g"),
			pad = function (val, len) {
				val = String(val);
				len = len || 2;
				while (val.length < len) {
					val = "0" + val;
				}
				return val;
			};

		// Regexes and supporting functions are cached through closure
		return function (date, mask, utc) {
			var dF = dateFormat, get, d, D, m, y, H, M, s, L, o, flags,
				// Some common format strings
				masks = {
					"default": "ddd mmm dd yyyy HH:MM:ss",
					shortDate: "m/d/yy",
					mediumDate: "mmm d, yyyy",
					longDate: "mmmm d, yyyy",
					fullDate: "dddd, mmmm d, yyyy",
					shortTime: "h:MM TT",
					mediumTime: "h:MM:ss TT",
					longTime: "h:MM:ss TT Z",
					isoDate: "yyyy-mm-dd",
					isoTime: "HH:MM:ss",
					isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
					isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
				},

				// Internationalization strings
				i18n = {
					dayNames: [
						"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
						"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
					],
					monthNames: [
						"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
						"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
					]
				};

			// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
			if (arguments.length === 1 && Object.prototype.toString.call(date) === "[object String]" && !/\d/.test(date)) {
				mask = date;
				date = undefined;
			}

			// Passing date through Date applies Date.parse, if necessary
			date = date ? new Date(date) : new Date();
			if (isNaN(date)) {
				throw new SyntaxError("invalid date");
			}

			mask = String(masks[mask] || mask || dF.masks["default"]);

			// Allow setting the utc argument via the mask
			if (mask.slice(0, 4) === "UTC:") {
				mask = mask.slice(4);
				utc = true;
			}

			get = utc ? "getUTC" : "get";
			d = date[get + "Date"]();
			D = date[get + "Day"]();
			m = date[get + "Month"]();
			y = date[get + "FullYear"]();
			H = date[get + "Hours"]();
			M = date[get + "Minutes"]();
			s = date[get + "Seconds"]();
			L = date[get + "Milliseconds"]();
			o = utc ? 0 : date.getTimezoneOffset();
			flags = {
				d: d,
				dd: pad(d),
				ddd: i18n.dayNames[D],
				dddd: i18n.dayNames[D + 7],
				D: D,
				m: m + 1,
				mm: pad(m + 1),
				mmm: i18n.monthNames[m],
				mmmm: i18n.monthNames[m + 12],
				yy: String(y).slice(2),
				yyyy: y,
				h: H % 12 || 12,
				hh: pad(H % 12 || 12),
				H: H,
				HH: pad(H),
				M: M,
				MM: pad(M),
				s: s,
				ss: pad(s),
				l: pad(L, 3),
				L: pad(L > 99 ? Math.round(L / 10) : L),
				t: H < 12 ? "a" : "p",
				tt: H < 12 ? "am" : "pm",
				T: H < 12 ? "A" : "P",
				TT: H < 12 ? "AM" : "PM",
				Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10]
			};

			return mask.replace(token, function ($0) {
				return (flags.hasOwnProperty($0)) ? flags[$0] : $0.slice(1, $0.length - 1);
			});
		};
	}());

// For convenience...
Date.prototype.format = function (mask, utc) {
	return dateFormat(this, mask, utc);
};

function startTime() {
	var now = new Date(),
		t;

	$("#date").text(now.format("longDate"));
	$("#day").text(now.format("dddd"));
	$("#time").text(now.format("h:MM TT"));

	t = setTimeout(function () {
		startTime();
	}, (30 * 1000));
}

function masterLoop() {

	// Determine which event pane comes next
	if (currentEventPane % totalPanes === 0) {
		currentEventPane = 1;
	} else {
		currentEventPane++;
	}

	$("#mainPane").html($("#eventPane" + currentEventPane).html());
	$(".tab").removeClass("front").eq(currentEventPane - 1).addClass("front");

	if (currentEventPane <= numFeatPanes) {
		$("#mainBottom").addClass("featured");
	} else {
		$("#mainBottom").removeClass("featured");
	}

	// determine which news/announce pane comes next
	if (currentNewsPane % numNewsPanes === 0) {
		currentNewsPane = 1;
	} else {
		currentNewsPane++;
	}

	$("#newsMain").html($("#newsPane" + currentNewsPane).html());

	window.setTimeout("masterLoop()", eventTiming);
	//currentEventPane = nextEventPane;
} // end masterLoop;

function announceLoop() {
	// determine which news/announce pane comes next
	if (currentNewsPane % numNewsPanes === 0) {
		currentNewsPane = 1;
	} else {
		currentNewsPane++;
	}

	$("#newsMain").html($("#newsPane" + currentNewsPane).html());

	window.setTimeout("announceLoop()", eventTiming);
}

// make a COWS json call
function fetch(returnData, url, callback) {
	$.ajax({
		dataType: 'jsonp',
		url: url,
		success: function (data) {
			window[returnData] = data;
			if (typeof callback === 'function') {
				callback.call(this); // look into switching to (this, data) to pass the data to the callback.
			}
		}
	});
} // function fetch

function prepareEvents() {

	var eventNum,
		event,
		location,
		start,
		end,
		time,
		inserted,
		orderStart,
		orderEnd;

	$("#pageFader").hide(); //fullFaderIn(100);

	//window.setTimeout("fullFaderOut(0)", 900 * 1000); //900 seconds

	window.setTimeout(function () {
		$("#pageFader").show(500, function () {
			window.location.href = "screensaver.html";
		});
	}, 900 * 1000); //900 seconds

	$("div[id^='newsPane']").hide();
	$("#newsPane").show();
	currentNewsPane = numNewsPanes;

	// add JSON COWS events into #eventsData, sorting them in correct order

	// http://localhost:52775/law/event/json?relStart=0&relEnd=0&display=lcd

//	urls.featured = "http://cows.ucdavis.edu/law/event/json?relStart=0&relEnd=0&display=lcd-feat";
//	urls.events = "http://cows.ucdavis.edu/law/event/json?relStart=0&relEnd=0&display=lcd";

	fetch("featJSON", urls.featured, function () {
		var paneNumber;
		
		// for each event in featJSON add it to the eventsData in order
		for (eventNum = 0; eventNum < featJSON.length; eventNum++) {

			start = new Date(parseInt(featJSON[eventNum].start.slice(6, -2), 10));
			end = new Date(parseInt(featJSON[eventNum].end.slice(6, -2), 10));

			time = start.format("h:MM TT") + ' &ndash; ' + end.format("h:MM TT");
			location = (featJSON[eventNum].location === null) ? featJSON[eventNum].buildingName + ' ' + featJSON[eventNum].roomName : featJSON[eventNum].location;

			event = '<div class="anEvent" data-start="' + start.format("m/d/yyyy h:MM:ss TT") + '" data-end="' + end.format("m/d/yyyy h:MM:ss TT") + '"><span class="title">' + featJSON[eventNum].title + '<\/span><br>' + time + '<br>' + location + '<\/div>';

			inserted = false;

			$("#tempFeaturedPane .anEvent").each(function (index, order) {
				orderStart = new Date($(order).data("start"));
				orderEnd = new Date($(order).data("end"));
				if (inserted === false) {
					if (start < orderStart) {
						$(order).before(event);
						inserted = true;
					} else if (!(start < orderStart || start > orderStart) && end < orderEnd) {
						$(order).before(event);
						inserted = true;
					} else if (!(start < orderStart || start > orderStart)) {
						$(order).before(event);
						inserted = true;
					}
				}
			});
			if (inserted === false) {
				if ($("#tempFeaturedPane .anEvent").length === 0) {
					$("#tempFeaturedPane").append(event);
				} else {
					$("#tempFeaturedPane .anEvent:last").after(event);
				}
			}
		}
		
		// sort events into groups of 5
		eventCount = $("#tempFeaturedPane .anEvent").length;
		numFeatPanes = Math.ceil(eventCount / 5);
		
		for (paneNumber = 1; paneNumber <= numFeatPanes; paneNumber++) {
			$("#eventsData").append('<div id="eventPane' + paneNumber + '"><\/div>');
			$("#eventsData #eventPane" + paneNumber).append($("#tempFeaturedPane .anEvent:lt(5)"));
		}

		fetch("eventJSON", urls.events, function () {

			// remove from events any that are also featured
			for (eventNum = 0; eventNum < featJSON.length; eventNum++) {
				eventJSON = $.grep(eventJSON, function (n) {
					return n.id !== featJSON[eventNum].id;
				});
			}

			// for each event in eventJSON add it into the eventsData in order
			for (eventNum = 0; eventNum < eventJSON.length; eventNum++) {

				start = new Date(parseInt(eventJSON[eventNum].start.slice(6, -2), 10));
				end = new Date(parseInt(eventJSON[eventNum].end.slice(6, -2), 10));

				time = start.format("h:MM TT") + ' &ndash; ' + end.format("h:MM TT");
				location = (eventJSON[eventNum].location === null) ? eventJSON[eventNum].buildingName + ' ' + eventJSON[eventNum].roomName : eventJSON[eventNum].location;

				event = '<div class="anEvent" data-start="' + start.format("m/d/yyyy h:MM:ss TT") + '" data-end="' + end.format("m/d/yyyy h:MM:ss TT") + '"><span class="title">' + eventJSON[eventNum].title + '<\/span><br>' + time + '<br>' + location + '<\/div>';

				inserted = false;

				$("#tempEventsPane .anEvent").each(function (index, order) {
					orderStart = new Date($(order).data("start"));
					orderEnd = new Date($(order).data("end"));
					if (inserted === false) {
						if (start < orderStart) {
							$(order).before(event);
							inserted = true;
						} else if (!(start < orderStart || start > orderStart) && end < orderEnd) {
							$(order).before(event);
							inserted = true;
						} else if (!(start < orderStart || start > orderStart)) {
							$(order).before(event);
							inserted = true;
						}
					}
				});
				if (inserted === false) {
					if ($("#tempEventsPane .anEvent").length === 0) {
						$("#tempEventsPane").append(event);
					} else {
						$("#tempEventsPane .anEvent:last").after(event);
					}
				}
			}
			
			// sort events into groups of 5
			eventCount = $("#tempEventsPane .anEvent").length;
			numEventPanes = Math.ceil(eventCount / 5);

			for (paneNumber = numFeatPanes + 1; paneNumber <= numFeatPanes + numEventPanes; paneNumber++) {
				$("#eventsData").append('<div id="eventPane' + paneNumber + '"><\/div>');
				$("#eventsData #eventPane" + paneNumber).append($("#tempEventsPane .anEvent:lt(5)"));
			}
			// now we have a nice long collection of events in #eventsData with which we can fill #mainPane

			totalPanes = numEventPanes + numFeatPanes;
			// start at last pane so masterLoop wraps around to first pane on first call
			currentEventPane = totalPanes;
			
			if (totalPanes > 0) {
				if (numFeatPanes > 0) {
					$("#featuredTitle").show();
					for (paneNumber = 1; paneNumber <= numFeatPanes; paneNumber++) {
						$(".leftTabs").append('<div class="tab">' + paneNumber + '</div>'); //((paneNumber === 1) ? "Featured" : paneNumber)
					}
				}
				if (numEventPanes > 0) {
					$("#eventsTitle").show();
					for (paneNumber = 1; paneNumber <= numEventPanes; paneNumber++) {
						$(".rightTabs").append('<div class="tab">' + paneNumber + '</div>');
					}
				}
			}
			
			fetch("announceJSON", urls.announcements, function () {
				var announceNum;

				for (announceNum = 0; announceNum < announceJSON.length; announceNum++) {
					$("#newsTemp").append('<div class="announceBullet">' + announceJSON[announceNum].d + '<\/div>');
				}

				announceCount = $("#newsTemp div").length;
				numNewsPanes = Math.ceil(announceCount / 4);
				currentNewsPane = numNewsPanes;

				for (paneNumber = 1; paneNumber <= numNewsPanes; paneNumber++) {
					$("#newsData").append('<div id="newsPane' + paneNumber + '"><\/div>');
					$("#newsData #newsPane" + paneNumber).append($("#newsTemp div:lt(4)"));
				}

//				totalPanes = 0;
				
				if (totalPanes > 0) {
					masterLoop();   // only need to loop if there are panes to swap
				} else {
					//change header to add text No Scheduled Events Today
					$("#mainTop").html('<img alt="" src="images/events-shadow.gif"><div id="noEventsText">Welcome to King Hall</div>')
				
					$("#mainBottom").html('<ul id="photos"></ul>')
						.css({"padding": "0",
							"background-color": "black",
							"height":"824px",
							"width":"1112px"
						});
					$('#photos').css({"padding": "0",
							"text-align": "center"
						}).jflickrfeed({
						limit: 20,
						qstrings: {
							id: '31293626@N06',
							tags: 'lcdscreennoevent' // get new tag from Sam
						},
						itemTemplate: '<li><img src="{{image_b}}" alt="" /></li>'
					}, function(data) {
						$('#photos img').each(function() {
							var imgClass = (this.width/this.height > 1) ? 'wide' : 'tall';
							$(this).addClass(imgClass);
						});
						$('#photos').cycle({
							timeout: 5000,
							fit: true,
							height:824,
							width:1112,
							random: true
						});
						masterLoop();
//						announceLoop();
					});
				}
			});
		});
	});
}
