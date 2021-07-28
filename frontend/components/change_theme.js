angular.module("theme_module", [])
	.factory('d3', function(){
		return d3;
	})
	.directive('directivechangetheme', [ function(){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			restrict: "E",
			scope: {theme: "="}, // {} = isolate, true = child, false/undefined = no change
			// controller: function($scope, $element, $attrs, $transclude) {},
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			// restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
			// template: '',
			// templateUrl: '',
			// replace: true,
			transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			link: function($scope, iElm, iAttrs, controller) {

				$(".glyphicon-adjust").on("click",
					function(){
						$scope.$apply(function(){
							if($scope.theme){
								$scope.theme = false;
								dark_theme_fun();
							} else {
								$scope.theme = true;
								light_theme_fun();
							}
						});
					}
				);
				function light_theme_fun(){
					$('.well').css("background", "#101011");//"#f5f5f5");
					$('body').css("background","white");

					//$('#info-map-container').css({"background-color":"white", "color":"#333"});
					//$('#menu-map-container').css({"background-color":"white", "color":"#333"});
				}

				function dark_theme_fun(){
					$('.well').css("background","#dcdcdc");
					$('body').css("background","#1F2D36");

					//$('#info-map-container').css({"background-color":"#1F2D36", "color":"#e0e0e0"});
					//$('#menu-map-container').css({"background-color":"#1F2D36", "color":"#e0e0e0"});
				}


			}
		};
	}]);
