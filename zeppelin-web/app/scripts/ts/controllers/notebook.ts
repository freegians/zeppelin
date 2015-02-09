/* global confirm:false, alert:false */
/* jshint loopfunc: true */
/* Copyright 2014 NFLabs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

/**
 * @ngdoc function
 * @name zeppelinWebApp.controller:NotebookCtrl
 * @description
 * # NotebookCtrl
 * Controller of notes, manage the note (update)
 *
 */

module zeppelin {

  export interface Notebook {
    id: string;
    name: string;
    config: NotebookConfig;
    paragraphs: Array<Paragraph>;
    info: any;
  }

  export interface NotebookConfig {
    cron: string;
    looknfeel: string;
  }

  interface INotebookCtrlScope extends ng.IScope {
    note: Notebook;
    showEditor: boolean;
    editorToggled: boolean;
    tableToggled: boolean;
    viewOnly: boolean;
    looknfeelOption: Array<string>;
    cronOption: Array<any>;
    interpreterSettings: Array<any>;
    interpreterBindings: Array<any>;
    showSetting: boolean;
    interpreterSelectionListeners: any;

    paragraphUrl: string;
    asIframe: boolean;

    getCronOptionNameFromValue: (value: string) => string;

    removeNote: (noteId: string) => void;
    runNote: () => void;
    toggleAllEditor: () => void;
    showAllEditor: () => void;
    hideAllEditor: () => void;
    toggleAllTable: () => void;
    showAllTable: () => void;
    hideAllTable: () => void;
    isNoteRunning: () => void;
    setLookAndFeel: (looknfeel: string) => void;
    setConfig: (config?: NotebookConfig) => void;
    setCronScheduler: (cronExpr: string) => void;
    sendNewName: () => void;
    interpreterBindingsOrig: any;
    openSetting: () => void;
    closeSetting: () => void;
    toggleSetting: () => void;
    saveSetting: () => void;
  }

  zeppelinWebApp.controller('NotebookCtrl', function(
    $scope: INotebookCtrlScope,
    $route,
    $routeParams,
    $location,
    $rootScope,
    $http) {

    $scope.note = null;
    $scope.showEditor = false;
    $scope.editorToggled = false;
    $scope.tableToggled = false;
    $scope.viewOnly = false;
    $scope.looknfeelOption = ['default', 'simple', 'report'];
    $scope.cronOption = [
      {name: 'None', value : undefined},
      {name: '1m', value: '0 0/1 * * * ?'},
      {name: '5m', value: '0 0/5 * * * ?'},
      {name: '1h', value: '0 0 0/1 * * ?'},
      {name: '3h', value: '0 0 0/3 * * ?'},
      {name: '6h', value: '0 0 0/6 * * ?'},
      {name: '12h', value: '0 0 0/12 * * ?'},
      {name: '1d', value: '0 0 0 * * ?'}
    ];

    $scope.interpreterSettings = [];
    $scope.interpreterBindings = [];

    $scope.getCronOptionNameFromValue = function(value) {
      if (!value) {
        return '';
      }

      for (var o in $scope.cronOption) {
        if ($scope.cronOption[o].value===value) {
          return $scope.cronOption[o].name;
        }
      }
      return value;
    };

    /** Init the new controller */
    var initNotebook = function() {
      $rootScope.$emit('sendNewEvent', {op: 'GET_NOTE', data: {id: $routeParams.noteId}});
    };

    initNotebook();

    /** Remove the note and go back tot he main page */
    /** TODO(anthony): In the nearly future, go back to the main page and telle to the dude that the note have been remove */
    $scope.removeNote = function(noteId) {
      var result = confirm('Do you want to delete this notebook?');
      if (result) {
        $rootScope.$emit('sendNewEvent', {op: 'DEL_NOTE', data: {id: noteId}});
        $location.path('/#');
      }
    };

    $scope.runNote = function() {
      var result = confirm('Run all paragraphs?');
      if (result) {
        $rootScope.$emit('runParagraph');
      }
    };

    $scope.toggleAllEditor = function() {
      if ($scope.editorToggled) {
          $rootScope.$emit('closeEditor');
      } else {
          $rootScope.$emit('openEditor');
      }
      $scope.editorToggled = !$scope.editorToggled;
    };

    $scope.showAllEditor = function() {
      $rootScope.$emit('openEditor');
    };

    $scope.hideAllEditor = function() {
      $rootScope.$emit('closeEditor');
    };

    $scope.toggleAllTable = function() {
      if ($scope.tableToggled) {
          $rootScope.$emit('closeTable');
      } else {
          $rootScope.$emit('openTable');
      }
      $scope.tableToggled = !$scope.tableToggled;
    };

    $scope.showAllTable = function() {
      $rootScope.$emit('openTable');
    };

    $scope.hideAllTable = function() {
      $rootScope.$emit('closeTable');
    };

    $scope.isNoteRunning = function() {
      var running = false;
      if(!$scope.note){ return false; }
      for (var i=0; i<$scope.note.paragraphs.length; i++) {
        if ( $scope.note.paragraphs[i].status === 'PENDING' || $scope.note.paragraphs[i].status === 'RUNNING') {
          running = true;
          break;
        }
      }
      return running;
    };

    $scope.setLookAndFeel = function(looknfeel) {
      $scope.note.config.looknfeel = looknfeel;
      $scope.setConfig();
    };

    /** Set cron expression for this note **/
    $scope.setCronScheduler = function(cronExpr) {
      $scope.note.config.cron = cronExpr;
      $scope.setConfig();
    };

    /** Update note config **/
    $scope.setConfig = function(config) {
      if(config) {
        $scope.note.config = config;
      }
      $rootScope.$emit('sendNewEvent', {op: 'NOTE_UPDATE', data: {id: $scope.note.id, name: $scope.note.name, config : $scope.note.config}});
    };

    /** Update the note name */
    $scope.sendNewName = function() {
      $scope.showEditor = false;
      if ($scope.note.name) {
        $rootScope.$emit('sendNewEvent', {op: 'NOTE_UPDATE', data: {id: $scope.note.id, name: $scope.note.name, config : $scope.note.config}});
      }
    };

    /** update the current note */
    $rootScope.$on('setNoteContent', function(event, note) {
      $scope.paragraphUrl = $routeParams.paragraphId;
      $scope.asIframe = $routeParams.asIframe;
      if ($scope.paragraphUrl) {
        note = cleanParagraphExcept($scope.paragraphUrl, note);
        $rootScope.$emit('setIframe', $scope.asIframe);
      }

      if ($scope.note === null) {
        $scope.note = note;
      } else {
        updateNote(note);
      }
      initializeLookAndFeel();
      //open interpreter binding setting when there're none selected
      getInterpreterBindings(getInterpreterBindingsCallBack);
    });


    var initializeLookAndFeel = function() {
      if (!$scope.note.config.looknfeel) {
        $scope.note.config.looknfeel = 'default';
      } else {
        $scope.viewOnly = $scope.note.config.looknfeel === 'report' ? true : false;
      }
      $rootScope.$emit('setLookAndFeel', $scope.note.config.looknfeel);
    };





    var cleanParagraphExcept = function(paragraphId, note) {
      var noteCopy : any = {};
      noteCopy.id = note.id;
      noteCopy.name = note.name;
      noteCopy.config = note.config;
      noteCopy.info = note.info;
      noteCopy.paragraphs = [];
      for (var i=0; i<note.paragraphs.length; i++) {
        if (note.paragraphs[i].id === paragraphId) {
          noteCopy.paragraphs[0] = note.paragraphs[i];
          if (!noteCopy.paragraphs[0].config) {
            noteCopy.paragraphs[0].config = {};
          }
          noteCopy.paragraphs[0].config.editorHide = true;
          noteCopy.paragraphs[0].config.tableHide = false;
          break;
        }
      }
      return noteCopy;
    };

    $rootScope.$on('moveParagraphUp', function(event, paragraphId) {
      var newIndex = -1;
      for (var i=0; i<$scope.note.paragraphs.length; i++) {
        if ($scope.note.paragraphs[i].id === paragraphId) {
          newIndex = i-1;
          break;
        }
      }

      if (newIndex<0 || newIndex>=$scope.note.paragraphs.length) {
        return;
      }
      $rootScope.$emit('sendNewEvent', { op: 'MOVE_PARAGRAPH', data : {id: paragraphId, index: newIndex}});
    });

    // create new paragraph on current position
    $rootScope.$on('insertParagraph', function(event, paragraphId) {
      var newIndex = -1;
      for (var i=0; i<$scope.note.paragraphs.length; i++) {
        if ($scope.note.paragraphs[i].id === paragraphId) {
          newIndex = i+1;
          break;
        }
      }

      if (newIndex === $scope.note.paragraphs.length) {
        alert('Cannot insert after the last paragraph.');
        return;
      }
      if (newIndex < 0 || newIndex > $scope.note.paragraphs.length) {
        return;
      }
      $rootScope.$emit('sendNewEvent', { op: 'INSERT_PARAGRAPH', data : {index: newIndex}});
    });

    $rootScope.$on('moveParagraphDown', function(event, paragraphId) {
      var newIndex = -1;
      for (var i=0; i<$scope.note.paragraphs.length; i++) {
        if ($scope.note.paragraphs[i].id === paragraphId) {
          newIndex = i+1;
          break;
        }
      }

      if (newIndex<0 || newIndex>=$scope.note.paragraphs.length) {
        return;
      }
      $rootScope.$emit('sendNewEvent', { op: 'MOVE_PARAGRAPH', data : {id: paragraphId, index: newIndex}});
    });

    $rootScope.$on('moveFocusToPreviousParagraph', function(event, currentParagraphId){
      var focus = false;
      for (var i = $scope.note.paragraphs.length - 1; i >= 0; i--) {
        if (focus === false ) {
          if ($scope.note.paragraphs[i].id === currentParagraphId) {
              focus = true;
              continue;
          }
        } else {
          var p = $scope.note.paragraphs[i];
          if (!p.config.editorHide && !p.config.tableHide) {
            $rootScope.$emit('focusParagraph', $scope.note.paragraphs[i].id);
            break;
          }
        }
      }
    });

    $rootScope.$on('moveFocusToNextParagraph', function(event, currentParagraphId){
      var focus = false;
      for (var i=0; i<$scope.note.paragraphs.length; i++) {
        if (focus === false ) {
          if ($scope.note.paragraphs[i].id === currentParagraphId) {
              focus = true;
              continue;
          }
        } else {
          var p = $scope.note.paragraphs[i];
          if (!p.config.editorHide && !p.config.tableHide) {
            $rootScope.$emit('focusParagraph', $scope.note.paragraphs[i].id);
            break;
          }
        }
      }
    });

    var updateNote = function(note) {
      /** update Note name */
      if (note.name !== $scope.note.name) {
        console.log('change note name: %o to %o', $scope.note.name, note.name);
        $scope.note.name = note.name;
      }

      $scope.note.config = note.config;
      $scope.note.info = note.info;

      var newParagraphIds = note.paragraphs.map(function(x, i, arr) {return x.id;});
      var oldParagraphIds = $scope.note.paragraphs.map(function(x, i, arr) {return x.id;});

      var numNewParagraphs = newParagraphIds.length;
      var numOldParagraphs = oldParagraphIds.length;

      /** add a new paragraph */
      if (numNewParagraphs > numOldParagraphs) {
        for (var index in newParagraphIds) {
          if (oldParagraphIds[index] !== newParagraphIds[index]) {
            $scope.note.paragraphs.splice(index, 0, note.paragraphs[index]);
            break;
          }
        }
      }

      /** update or move paragraph */
      if (numNewParagraphs === numOldParagraphs) {
        for (var idx in newParagraphIds) {
          var newEntry = note.paragraphs[idx];
          if (oldParagraphIds[idx] === newParagraphIds[idx]) {
            $rootScope.$emit('updateParagraph', {paragraph: newEntry});
          } else {
            // move paragraph
            var oldIdx = oldParagraphIds.indexOf(newParagraphIds[idx]);
            $scope.note.paragraphs.splice(oldIdx, 1);
            $scope.note.paragraphs.splice(idx, 0, newEntry);
            // rebuild id list since paragraph has moved.
            oldParagraphIds = $scope.note.paragraphs.map(function(x) {return x.id;});
          }
        }
      }

      /** remove paragraph */
      if (numNewParagraphs < numOldParagraphs) {
        for (var oldidx in oldParagraphIds) {
          if(oldParagraphIds[oldidx] !== newParagraphIds[oldidx]) {
            $scope.note.paragraphs.splice(oldidx, 1);
            break;
          }
        }
      }
    };

    var getInterpreterBindings = function(callback?) {
      $http.get(restApiBase() + '/notebook/interpreter/bind/' + $scope.note.id).
        success(function(data, status, headers, config) {
          $scope.interpreterBindings = data.body;
          $scope.interpreterBindingsOrig = jQuery.extend(true, [], $scope.interpreterBindings); // to check dirty
          if (callback) {
            callback();
          }
        }).
        error(function(data, status, headers, config) {
          console.log('Error %o %o', status, data.message);
        });
    };

    var getInterpreterBindingsCallBack = function() {
      var selected = false;
      for (var i in $scope.interpreterBindings) {
        var setting = $scope.interpreterBindings[i];
        if (setting.selected) {
          selected = true;
          break;
        }
      }

      if (!selected) {
        // make default selection
        var selectedIntp = {};
        for (var i in $scope.interpreterBindings) {
          var setting = $scope.interpreterBindings[i];
          if (!selectedIntp[setting.group]) {
            setting.selected = true;
            selectedIntp[setting.group] = true;
          }
        }
        $scope.showSetting = true;
      }
    };

    $scope.interpreterSelectionListeners = {
      accept : function(sourceItemHandleScope, destSortableScope) {return true;},
      itemMoved: function (event) {},
      orderChanged: function(event) {}
    };

    $scope.openSetting = function() {
      $scope.showSetting = true;
      getInterpreterBindings();
    };

    $scope.closeSetting = function() {
      var isSettingDirty = !angular.equals($scope.interpreterBindings, $scope.interpreterBindingsOrig);
      if (isSettingDirty) {
        var result = confirm('Changes will be discarded');
        if (!result) {
          return;
        }
      }
      $scope.showSetting = false;
    };

    $scope.saveSetting = function() {
      var selectedSettingIds = [];
      for (var no in $scope.interpreterBindings) {
        var setting = $scope.interpreterBindings[no];
        if (setting.selected) {
          selectedSettingIds.push(setting.id);
        }
      }

      $http.put(restApiBase() + '/notebook/interpreter/bind/' + $scope.note.id,
               selectedSettingIds).
        success(function(data, status, headers, config) {
          console.log('Interpreter binding %o saved', selectedSettingIds);
          $scope.showSetting = false;
        }).
        error(function(data, status, headers, config) {
          console.log('Error %o %o', status, data.message);
        });
    };

    $scope.toggleSetting = function() {
      if ($scope.showSetting) {
        $scope.closeSetting();
      } else {
        $scope.openSetting();
      }
    };
  });
}