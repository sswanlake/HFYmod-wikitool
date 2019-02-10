// ==UserScript==
// @name         HFYmod-wikitool
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  A tool for Reddit's r/HFY wiki Mods
// @author       /u/sswanlake
// @match        *.reddit.com/r/HFY/comments/*
// @updateURL    https://github.com/sswanlake/HFYmod-wikitool/raw/master/HFYmod-wikitool.user.js
// @grant        none
// ==/UserScript==

//previously: full message link, only show "author page" if non-zero story count, fixed spacing, only hide one series page
//what's new: escapes underscores in usernames, displays "exists"/number on button, length of posts, doesn't show mod-removed, select text on click!

(function() {
	'use strict';

    jQuery.fn.modal = function () {
        this.css("display","none");
        this.css("position", "fixed");
        this.css("padding-top", "100px");
        this.css("padding-bottom", "100px");
        this.css("left", "0");
        this.css("top", "0");
        this.css("width", "100%");
        this.css("height", "100%");
        this.css("overflow", "auto"); //overflow-y
        this.css("background-color", "rgb(0,0,0)");
        this.css("background-color", "rgba(0,0,0,0.4)");
        return this;
    }; //css modal

    jQuery.fn.modalContent = function () {
        this.css("background-color", "#fefefe");
        this.css("color", "#000000");
        this.css("margin", "auto");
        this.css("padding", "15px");
        this.css("padding-bottom", "100px");
        this.css("border", "1px solid #888");
        this.css("width", "80%");
        this.css("overflow-y", "initial");
	    return this;
    }; //css modal-content

    function timeConvert(UNIX_timestamp) {
        var a = new Date(UNIX_timestamp * 1000);
        var year = a.getFullYear();
        var month = (`0${a.getUTCMonth() + 1}`).slice(-2);
        var date = (`0${a.getUTCDate()}`).slice(-2);
        var hour = (`0${a.getUTCHours()}`).slice(-2);
        var min = (`0${a.getUTCMinutes()}`).slice(-2);
        var sec = (`0${a.getUTCSeconds()}`).slice(-2);
        return `${month}-${date}-${year} ${hour}:${min}:${sec}`;
    } //make dates human readable

    String.prototype.toProperCase = function () {
        return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }; //capitalize first letter of given string

    function selectText(element) {
        var doc = document
            , text = element
            , range, selection
        ;
        if (doc.body.createTextRange) { //ms
            range = doc.body.createTextRange();
            range.moveToElementText(text);
            range.select();
        } else if (window.getSelection) { //all others
            selection = window.getSelection();
            range = doc.createRange();
            range.selectNodeContents(text);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    } //function for selecting text in <pre> on click


    $(document).ready(function(){
        var baseDomain = (window.location.hostname == 'mod.reddit.com' ? 'https://www.reddit.com' : `https://${window.location.hostname}`);
        var author = $(".author")[12].innerHTML; //the array=12 instance of the class "author". 0=you, 1=adamwizzy, 2-11=mods, 12=author, 13=first commenter, etc.

        var Btn = $('<button id="myBtn" title="Display the author\'s submissions to HFY as part of a wikipage template">Wiki Template <span id="YN"></span></button>');
        var preface = (`You have been added to the wiki. We created the following pages for you.\n\n`);
        var postface = (`* [${author.split("_").join("\\_")}](/r/HFY/wiki/authors/${author.toLowerCase()})\n\nYou are free to edit your pages as you see fit. We strongly recommend maintaining your own pages. [Here](http://www.reddit.com/r/HFY/wiki/ref/wiki_updating) is a little guide to Wiki updating if you need it. If you start a new series please let us know so that we can create the page. If you have any questions send us a [message](http://www.reddit.com/message/compose?to=%2Fr%2FHFY).\n`);
        var MessageURL = encodeURI(preface + postface); //...encode URI is supposed to make it nicely URL friendly, but doesn't seem to want to play right now... browsers are smart though
        var BtnContent = $(`
            <div id="myModal" class="modal" style="font-size: 120%;" >
                <div class="modal-content">
                    <span class="close" style="float:right; font-size:28px; font-weight:bold; cursor: pointer;">&times;</span>
                    <p style="font-size: 200%" id="username"><a href="${baseDomain}/user/${author}" target="_blank">/u/${author}</a></p>
                    <p><span id="totalSubmissions" style="color:red"></span> total submissions, <span id="hfycount" style="color:red"></span> of which are in HFY</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Of those, <span id="storycount" style="color:red"></span> are stories and <span id="metacount" style="color:red"></span> are other submissions</p>
                    <hr/>
                    <p><strong style="font-size: 150%">WIKI:</strong> <a href="${baseDomain}/r/HFY/wiki/authors/${author}" target="_blank" style="font-size: 150%">${author}</a>  &nbsp; &nbsp; <span id="existsYN"></span>  &nbsp; &nbsp; <a onclick="$('.authorpage').toggle()">hide author</a></p>
                    <div class="authorpage" id="authorpage" style="border:1px solid gray; background:Lavender; height:250px; overflow-y:auto; overflow-x:auto;"><pre><p>**${author.split("_").join("\\_")}**<br>
##**One Shots**
<span id="stories"></span>
<span id="serieslabel"></span>
&amp;nbsp;

---
[All Authors](https://www.reddit.com/r/HFY/wiki/authors)
</pre>
                    </div>
                    <p>Don't forget to <span style="color:red">give editing permissions</span> to the user, send a <a id="message" href="https://www.reddit.com/message/compose/?to=${author}&subject=HFY+Wiki&message=${MessageURL}" target="_blank">message</a>, and list the page on <a href="https://www.reddit.com/r/HFY/wiki/authors" target="_blank">All Authors</a> / <a href="https://www.reddit.com/r/HFY/wiki/series" target="_blank">All Series</a></p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;- If repeat series name, format is "[series](series_author) [*author*]" </p>
<hr/>
                    series name: <input type="text" id="seriesname" value="" /> (Hit enter to submit)
                    <p>Other submissions:  &nbsp; &nbsp; <a onclick="$('.otherposts').toggle()">hide other</a></p>
                    <div class="otherposts" style="border:1px solid gray; background:Lavender; max-height:250px; overflow-y:auto; overflow-x:auto;">
                        <pre><span id="otherposts"></span></pre>
                    </div>
                    <p>&nbsp;</p>
                    <div class="endOfModal">
                    </div>
                </div>
            </div>
        `);

        //add in the button and its contents and format css elements
        $(".expando").prepend(Btn);
        $("body").append(BtnContent);
        $(".modal").modal();
        $(".modal-content").modalContent();

        $("#myBtn").click(function() {
	        $(".modal").css("display","block");
            $('body').css("overflow", "hidden");
	    }); // When the user clicks the button, open the modal

        $('.close')[0].onclick = function() {
            $('.modal').css("display","none");
            $('body').css("overflow", "auto");
        }; // When the user clicks on <span> (x), close the modal

        window.onclick = function(event) {
            if (event.target == $('.modal')[0]) {
                $('.modal').css("display","none");
                $('body').css("overflow", "auto");
            }
        }; // close the modal if the user clicks outside the modal content

	//getting the json with the information
        var lastID = null;
        var totalSubmissions = 0;
        var hfycount = 0;
        var storycount = 0;
        var metacount = 0;

        function load(after) {
            $.getJSON(`https://www.reddit.com/user/${author}/submitted.json?sort=new&after=${after}`, function (foo) {
                var children = foo.data.children;
                var date;
                $.each(children, function (i, post) {
                    if (post.data.subreddit == "HFY"){
                        date = timeConvert(post.data.created_utc);
                        hfycount++;
                        var flair = post.data.link_flair_css_class;
                        var leng = (post.data.selftext).length;
                        if ((flair == "META") || (flair == "Text") || (flair == "Misc") || (flair == "Video") || (post.data.link_flair_text == "WP")){ //WP needs a special case because reasons. Meta used to be META. Also, there used to be a "meta mod" flair
                            if ((!post.data.removed) && (!post.data.banned_by)){ //"banned_by" is the older version of "removed" apparently
                                $("#otherposts").prepend( `<label>* <a href="${post.data.url}" title="flair: ${post.data.link_flair_text},  created: ${date},  score: ${post.data.score}">` + post.data.title + `</a>\n</label>` );
                            } else {
                                $("#otherposts").prepend( `<label>* <a style="color:DarkSlateBlue" href="${post.data.url}" title="flair: ${post.data.link_flair_text},  created: ${date},  score: ${post.data.score}">` + post.data.title + `</a>\n</label>` );
                            };
                            metacount++;
                        } else {
                            if ((!post.data.removed) && (!post.data.banned_by)){ //"banned_by" is the older version of "removed" apparently
                                if (post.data.over_18) {
                                    $("#stories").prepend( `<label>* [<a href="${post.data.url}" title="flair: ${post.data.link_flair_text},  created: ${date},  score: ${post.data.score},  pagecount: ${leng/2000}">` + (post.data.title).replace(`[OC]`, '').replace(`(OC)`, '').replace(`[PI]`, '').trim() + `</a>]<span style="color:purple">(` + post.data.url + `)</span> <emphasis style="color:red;">*NSFW*</emphasis>\n</label>` );
                                } else {
                                    $("#stories").prepend( `<label>* [<a href="${post.data.url}" title="flair: ${post.data.link_flair_text},  created: ${date},  score: ${post.data.score},  pagecount: ${leng/2000}">` + (post.data.title).replace(`[OC]`, '').replace(`(OC)`, '').replace(`[PI]`, '').trim() + `</a>](` + post.data.url + `)\n</label>` );
                                }
                                storycount++;
                            };
                        }
                    }
                    $('#hfycount').html(`${hfycount}`);
                    $('#storycount').html(`${storycount}`);
                    $('#metacount').html(`${metacount}`); //update numbers
                });
                if (children && children.length > 0) {
                    lastID = children[children.length - 1].data.name;
                    totalSubmissions += children.length;
                    $('#totalSubmissions').html(`${totalSubmissions}`);
                    load(lastID);
                }
                if (storycount == 0) {
                    $('.authorpage').hide();
                }
            })
            .error(function() {
                if (author == "[deleted]") {
                    $("#stories").append( `<span style="color:red">ERROR - ACCOUNT DELETED</span>`);
                } else {
                    $("#stories").append( `<span style="color:red">ERROR ... Shadowbanned?</span>`);
                }
            }); //end error
        } //end load

        function check(author) {
            $.getJSON(`https://www.reddit.com/r/HFY/wiki/authors/${author}.json`, function (bar) {
                $("#existsYN").append( `<span style="color:red">It exists - </span> <a href="https://www.reddit.com/r/HFY/wiki/edit/authors/${author}">Edit?</a>`);
                $("#YN").html( `- Exists`);
            })
            .error(function() {
                $("#existsYN").append( `<span style="color:red">Does not exist. <a href="https://www.reddit.com/r/HFY/wiki/create/authors/${author}">Create?</a></span> ... `);
                $("#YN").html( ` - <span style="color:red">${storycount}</span>`);
            }); //end error
        } //end check exists

        check(author);
        load(lastID);

        // When user enters the series
        var series;
        var series_;
        var seriesURL = [];
        var seriescount = 0;
        var serieslength;
        var seriesContent = (`
            <hr/>
            <p>Series no. <span id="series-count" style="color:blue">${seriescount}</span>  has <span id="entrycount" style="color:red"></span> stories  &nbsp; &nbsp; <a id="seriesclick" onclick="$('#seriespage').toggle()">hide <i>this</i> series page</a></p>
            <div id="seriespage" style="border:1px solid gray; background:Lavender; max-height:250px; overflow-y:auto; overflow-x:auto;"><pre>
[**${author.split("_").join("\\_")}**](/r/HFY/wiki/authors/${author.toLowerCase()})

##**<a id="seriesURL"><span id="series-header">Series</span></a>**
<span id="seriesStories"></span>
&amp;nbsp;

---
[All Series](https://www.reddit.com/r/HFY/wiki/series)
</pre>
            </div>
        `);

        $("#seriesname").keyup(function(e){
            var code = e.which; // recommended to use e.which, it's normalized across browsers
            if(code==13)e.preventDefault();
            if(code==13){ //13=enter
                series = $(this).val().toString(); //$('#storycount').html($('#stories')[0].innerHTML);
                series_ = series.toLowerCase().replace(/\s/g, '_').replace(/['!"#$\-%&\\'()\*+,\.\/:;<=>?@\[\\\]\^`{|}~']/g,""); //the url, to be not case-sensitive
                //
                //
                $(this).val(''); //reset input field
                seriescount++;
                if (seriescount == 1) {
                    $("#serieslabel").prepend(`##**Series** \n <span id="author-series"></span>`); //add header for series list to Author page
                }
                $(".endOfModal").prepend(seriesContent); //for some reason the numbering gets reverse if you append //reason now known, too lazy to fix
                $('#series-count').attr("id", "series-count-" + seriescount).html(`${seriescount}`); //gives each series template a unique id //$(`span[id*= ${seriescount}]`)
                $('#seriespage').attr("id", "seriespage-" + seriescount);
                $('a#seriesclick').attr("id", "seriesclick-" + seriescount).attr("onclick", `$("#seriespage-" + ${seriescount}).toggle()`); //makes sure it the "Hides" hide the right section
                $('a#seriesURL').attr("id", "seriesURL-" + seriescount).attr("href", `https://www.reddit.com/r/HFY/wiki/series/${series_}`); //changes URL at the top of Series page
                $("#author-series").append( `####[<a href="https://www.reddit.com/r/HFY/wiki/series/${series_}" target="_blank">${series.toProperCase()}</a>](/r/HFY/wiki/series/${series_})\n` ); //add this series to the list on the Author page
                $("#series-header").html(`${series.toProperCase()}`); //names of series on Series Page
                seriesURL.push(`* [${series.toProperCase()}](/r/HFY/wiki/series/${series_})\n\n`); //add new series to the list for message
                MessageURL = encodeURIComponent(preface + seriesURL.join("") + postface); //encodeURI
                $("a#message").attr("href", `https://www.reddit.com/message/compose/?to=${author}&subject=HFY+Wiki&message=${MessageURL}`);

                $("#stories label:contains('" + series + "'), #stories label:contains('" + series_ + "')").clone().appendTo("#seriesStories"); //contains series or series_, copy them
                serieslength = $("#stories label:contains('" + series + "'), #stories label:contains('" + series_ + "')").css("display","none").length; //hide the originals and find out how many
                $("#entrycount").html(`${serieslength}`);
            }

            //selecting everything inside each <pre> tag (the good stuff)
            var preTags = document.getElementsByTagName('pre');
            for(var i=0;i<preTags.length;i++) {
                preTags[i].onclick = function() {selectText(this)};
            }
        }); //end get series

    }); //document ready

})();
