'use strict';

var app = angular.module("prova2", ["slider_module", "theme_module", "mapdiv", "viralitydiv", "liquiddiv", "wordsdiv"])
	.controller("div1", ["$scope", '$http', '$window', '$interval','$timeout', function($scope){

			$scope.theme = 0;

			$scope.slider = {value: 1};

			var currentTime = new Date();
			$scope.date = {day: 1, month: 1, year: 1998};
			$scope.model_actual_array_date = [];

			$scope.model_frequency = 0;
			
			$scope.model_months_name = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

			$scope.model_topic = "all";
			$scope.model_admindivlevel = 1;

			$scope.mobile = false;

			$scope.model_map_type = "map";

			$scope.model_view = "map";

			$scope.model_virality = "retweet";

			$scope.model_administrative_division_1 = "1";
			$scope.model_administrative_division_2 = "2";


			$scope.changeName = function() {
				$scope.slider = 0;
			}

			$scope.back_slider_icon = function() {
				
			}
	}]);
function updatePrecisionMap($scope){
	console.log("change! "+ $scope.parameterAdmindivlevel)
}