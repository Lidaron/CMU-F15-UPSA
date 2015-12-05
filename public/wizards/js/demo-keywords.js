/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* global $ */

'use strict';

$(document).ready(function() {

  // jquery dom variables

  /**
   * Helper functions for displaying autocompletion results
   */
  var getType = function(id) {
    return id.match(/^\/graphs/) ? 'concept' : 'document';
  };
  var trunc = function(s) {
    if (typeof s !== 'string') {
      return '';
    }
    return s.length > 40 ? s.substring(0, 50) + '...' : s;
  };
  var conceptSuggestion = function(d) {
    if (getType(d.id) === 'concept') {
      return '<div><strong>' + d.label + '</strong> <i class=\'pull-right\'>' +
        getType(d.id) + '</i><br><i class="concept-abstract">' + trunc(d.abstract) + '</i></div>';
    } else {
      return '<div><strong>' + d.label + '</strong> <i class=\'pull-right\'>' +
        getType(d.id) + '</i></div>';
    }
  };

  var pendingSuggestion = function(query) {
    return '<div class="tt--search-hint"><i>Searching for ' + query.query + '</i></div>';
  }

  /**
   * Event handler for tab changes
   */
  $('.tab-panels--tab').click(function(e) {
    e.preventDefault();
    var self = $(this);
    var inputGroup = self.closest('.tab-panels');
    var idName = null;

    inputGroup.find('.tab-panels--tab.active').removeClass('active');
    inputGroup.find('.tab-panels--tab-pane.active').removeClass('active');
    self.addClass('active');
    idName = self.attr('href');
    $(idName).addClass('active');
    $('.input--API').removeClass('active');
    $('.input--endpoint').removeClass('active');
    $(idName + '-endpoint').addClass('active');
    $('._demo--output').css('display', 'none');
  });

  /**
   * Event handler for concept tabs
   */
  $('.concept--new-concept-container').click(function(e) {
    e.preventDefault();
    var self = $(this);
    var concept = self.closest('.concept');

    concept.find('.active').removeClass('active');
    concept.find('.concept--input-container').addClass('active');
    concept.find('.concept--input').focus();
  });

  /**
   * Event handler for auto complete
   */
  $('.concept--input').citypeahead({
    selectionCb: selectionCallback,
    hint: false
  }, {
    templates: {
      suggestion: conceptSuggestion,
      pending: pendingSuggestion
    },
    source: sourceLabelSearch
  });

  $('.concept--input').keyup(function (e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13){
      console.log($('.tt-suggestion').first().attr('class'));
      $('.tt-suggestion').first().addClass('tt-cursor');

    }
  });

  var query_data = '';

  function sourceLabelSearch(query, callback) {
    query_data = query;
    return $.get('/api/labelSearch', {
      query: query,
      limit: 7,
      concept_fields: JSON.stringify({
        abstract: 1
      })
    }).done(function(results) {
      $('#concepts-panel-API-data').empty();
      $('#concepts-panel-API-data').html(JSON.stringify(results, null, 2));
      $('#label-search-view-code-btn').removeAttr('disabled');
      $('#label-search-view-code-btn').prev().removeClass('icon-code-disabled');

      if(results.matches.length == 0){
        $('.tt-dataset').html('<div class="tt--search-hint"><i>no concepts found</i></div>');
      }

      var filtered = {};
      filtered['matches'] = results.matches.filter(function(elem) {
        return elem.id.match(/^\/graphs/);
      });
      callback(filtered);
    }).fail(function(error) {
      // console.log('sourceLabelSearch.error:',error)
    });
  }

  function selectionCallback(concept) {
    var label = concept;
    var $template = $('.concept').last().clone();

    $template.find('.label').text(label);
    $template.find('.label').attr('concept_id', concept);
    $template.find('.concept--close-icon').click(function() {
      $(this).closest('.concept').remove();
    });
    $template.insertBefore('.concept:nth-last-child(1)');

    $('.concept:nth-last-child(1) > .concept--input-container').empty();
    $('.concept:nth-last-child(1) > .concept--input-container')
      .html('<input class="concept--input" type="text">');

    $('.concept--input').citypeahead({
      selectionCb: selectionCallback,
      hint: false
    }, {
      templates: {
        suggestion: conceptSuggestion,
        pending: pendingSuggestion
      },
      source: sourceLabelSearch
    });

    $('.concept--input').keyup(function (e) {
      var code = (e.keyCode ? e.keyCode : e.which);
      if (code == 13){
        console.log($('.tt-suggestion').first().attr('class'));
        $('.tt-suggestion').first().addClass('tt-cursor');

      }
    });

    $('.concept:nth-last-child(1) > .concept--input-container').removeClass('active');
    $('.concept:nth-last-child(1) > .concept--new-concept-container').addClass('active');

  }

  /**
   * Event handler for reset button
   */
  $('.reset-button').click(function(){
    location.reload();
  });

  /**
   * Event handler for using sample text
   */
  $('#sample-1').click(function(){
    $.ajax({
        url : '../data/declaration.txt',
        dataType: "text",
        success : function (data) {
            $("#body-of-text").text(data);
            getAbstractConcepts();
        }
    });
  });

  $('#sample-2').click(function(){
    $.ajax({
        url : '../data/emmewatson.txt',
        dataType: "text",
        success : function (data) {
            $("#body-of-text").text(data);
            getAbstractConcepts();
        }
    });
  });



});

function show_label_search_response() {
  $('#concepts-panel-API').toggleClass('active');
}

function show_text_annotator_response() {
  $('#text-panel-API').toggleClass('active');
}

function show_conceptual_search_response() {

}

var typingTimer;
var doneTypingInterval = 500;  // 0.5 seconds
var $input = $('#body-of-text');

//on keyup, start the countdown
$input.on('keyup', function () {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(getAbstractConcepts, doneTypingInterval);
});

//on keydown, clear the countdown
$input.on('keydown', function () {
  clearTimeout(typingTimer);
});

var previousText = '';
function getAbstractConcepts() {
  var text = $('#body-of-text').text();
  text = text.length > 0 ? text : ' ';
  if(text != previousText){
    $.post('/api/alchemyKeywords', {
        text: text
      })
      .done(function(results) {

        $('.concept--abstract-concept-list').empty();

        var unique_concept_array = [];

        if (results.keywords.length)
          $('.concept--abstract-concept-title').addClass('active');

        for (var i = 0; i < results.keywords.length; i++) {
          if (check_duplicate_concept(unique_concept_array, results.keywords[i].text) || unique_concept_array.length == 3)
            continue;
          else
            unique_concept_array.push(results.keywords[i].text);

          var abstract_concept_div = '<div class="concept--abstract-concept-list-container"><span class="concept--abstract-concept-list-item" concept_id="' + results.keywords[i].text + '">' + results.keywords[i].text + '</span></div>';
          $('.concept--abstract-concept-list').append(abstract_concept_div);
        }

        $('#text-panel-API-data').empty();
        $('#text-panel-API-data').html(JSON.stringify(results, null, 2));
        $('#text-annotator-view-code-btn').removeAttr('disabled');
        $('#text-annotator-view-code-btn').prev().removeClass('icon-code-disabled');

        var concept_array = [];
        var input_concept_labels = [];
        for (var i = 0; i < ($('.concept--abstract-concept-list-item').length < 3 ? $('.concept--abstract-concept-list-item').length : 3); i++) {
          concept_array.push($('.concept--abstract-concept-list-item:eq(' + i + ')').attr('concept_id'));
          input_concept_labels.push($('.concept--abstract-concept-list-item:eq(' + i + ')').text());
        }

        if (concept_array.length > 0) {
          $('._demo--output').css('display', 'none');
          $('._content--loading').show();

          $.get('/api/conceptualSearch', {
              ids: concept_array,
              limit: 3,
              document_fields: JSON.stringify({
                user_fields: 1
              })
            })
            .done(function(results) {

            }).fail(function(error) {
              error = error.responseJSON ? error.responseJSON.error : error.statusText;
              console.log('error:', error);
            }).always(function() {
              $('._content--loading').css('display', 'none');
              $('._demo--output').show();

              var top = document.getElementById('try-this-service').offsetTop;
              window.scrollTo(0, top);
            });
        }

      }).fail(function(error) {
        error = error.responseJSON ? error.responseJSON.error : error.statusText;
        console.log('extractConceptMentions error:', error);
      }).always(function() {

      });
      previousText = text;
    }
}

function check_duplicate_concept(unique_concept_array, concept) {
  for (var i = 0; i < unique_concept_array.length; i++) {
    if (unique_concept_array[i] == concept)
      return true;
  }

  return false;
}
