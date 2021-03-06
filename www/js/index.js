﻿/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
function MainPageView( pageElement )
{
	var inputFields = pageElement.find( 'input[type="number"]' );
	var calculateButton = pageElement.find( '#btnCalculate' );
	var resultField = pageElement.find( 'input#forPay' );
	
	return {
		getInputValues: function()
		{
			var result = {};
			inputFields.each( function( index, dom ) {
				element = $(dom);
				result[element.attr('id')] = parseInt(element.val());
			});
			return result;
		},
		validate: function()
		{
			var success = true;
			inputFields.each( function( index, dom ) {
				element = $(dom);
				regexp = new RegExp('^' + element.attr('pattern') + '$', 'i');
				if ( !regexp.test( element.val() ) && success === true)
				{
					success = false;
				}
			});
			return success;
		},
		showResult: function( result )
		{
			resultField.attr( 'value', result + ' грн.' );
		},
		onCalculateButtonClick: function( handler )
		{
			calculateButton.unbind( 'click' );
			calculateButton.bind( 'click', this, handler );
		}
	};
};

function OptionsPageView( pageElement )
{
	var inputFields = pageElement.find( 'input[type="number"]' );
	var saveButton = pageElement.find( '#btnSave' );
	var cancelButton = pageElement.find( '#btnCancel' );
	
	return {
		getInputValues: function()
		{
			var result = {};
			var parseFunctions = {
				'int': parseInt,
				'float': parseFloat
			}
			inputFields.each( function( index, dom ) {
				element = $(dom);
				result[element.attr('id')] = parseFunctions[element.attr('data-type')](element.val());
			});
			return result;
		},
		validate: function()
		{
			var success = true;
			inputFields.each( function( index, dom ) {
				element = $(dom);
				regexp = new RegExp('^' + element.attr('pattern') + '$', 'i');
				if ( !regexp.test( element.val() ) && success === true)
				{
					success = false;
				}
			});
			return success;
		},
		showStoredOptions: function( options )
		{
			inputFields.each( function( index, dom ) {
				element = $(dom);
				dom.value = options[element.attr('id')];
				element.attr('value', options[element.attr('id')]);
			});
		},
		onSaveButtonClick: function( handler )
		{
			saveButton.unbind( 'click' );
			saveButton.bind( 'click', this, handler );
		},
		onCancelButtonClick: function( handler )
		{
			cancelButton.unbind( 'click' );
			cancelButton.bind( 'click', this, handler );
		}
	};
};

function OptionsStorage()
{
	var options = {
		'nightFactor': 0.5,
		'dayFactor': 1.0,
		'firstBlockLimit': 100,
		'secondBlockLimit': 600,
		'firstBlockTax': 57.0,
		'secondBlockTax': 99.0,
		'thirdBlockTax': 156.0,
		'powerCredit': 120,
		'discount': 25
	};
	
	var storage = null;
	
	function optionsFetched( opts )
	{
		console.log('Options fetched: ' + opts);
		options = JSON.parse( opts );
		$(document).trigger( 'optionsChanged', [options] );
	}
	
	function optionsStored()
	{
		console.log('Options are stored succesfully.');
	}
	
	function storageFailure( error )
	{
		console.log('Failed to get/store options. See message below.');
		console.log(error.exception);
	}
	
	document.addEventListener("deviceready", function() {
		console.log('Deviceready event triggered');
		if ( !storage )
		{
			console.log('Initializing storage');
			storage = NativeStorage;
			if ( storage )
			{
				console.log('Trying to get options');
				storage.getItem( 'options', optionsFetched, storageFailure );
			}
			else
			{
				console.log('Storage is not available!');
			}
			
		}	
	}, false);
	
	return {
		getOptions: function()
		{
			console.log('Get options called');
			return options;
		},
		setOptions: function( opt )
		{
			if ( storage !== null ) 
			{
				options = opt;
				$(document).trigger( 'optionsChanged', [opt] );
				var serializedOptions = JSON.stringify( opt );
				storage.setItem( 'options', serializedOptions, optionsStored, storageFailure );
			}
			else
			{
				var errorText = "Critical error: native storage is not supported";
				console.error( errorText );
			}
		}
	};
};

function BillCalculator( optionsStorage )
{
	var storage = optionsStorage;
	var options = storage.getOptions();
	
	$(document).on('optionsChanged', function( event, opt ) {
		options = opt;
		console.log('Options changed: ' + JSON.stringify( options ) );
	});
	
	function round(num, places) 
	{ 
		return +(Math.round(num + "e+" + places)  + "e-" + places);
	}
	
	return {
		calculate: function( input )
		{
			var discount = options.discount / 100;
			var discountedFirstBlockTax = round( options.firstBlockTax - options.firstBlockTax * discount, 2 );
			var discountedSecondBlockTax = round( options.secondBlockTax - options.secondBlockTax * discount, 2 );
			var discountedThirdBlockTax = round( options.thirdBlockTax - options.thirdBlockTax * discount, 2 );
			var totalConsumption = parseInt(input.nightValue) + parseInt(input.dayValue);
			var nightConsumptionFactor = round( input.nightValue / totalConsumption, 3 );
			var dayConsumptionFactor = 1 - nightConsumptionFactor;
			
			var nightDiscountedFirstBlock = 0;
			if ( totalConsumption-options.firstBlockLimit > 0 )
			{
				if ( options.firstBlockLimit - options.powerCredit > 0 )
				{
					nightDiscountedFirstBlock = Math.round( options.powerCredit * nightConsumptionFactor );
				}
				else
				{
					nightDiscountedFirstBlock = Math.round( options.firstBlockLimit * nightConsumptionFactor );
				}
			}
			else
			{
				if ( totalConsumption - options.powerCredit > 0 )
				{
					nightDiscountedFirstBlock = Math.round(options.powerCredit * nightConsumptionFactor);
				}
				else
				{
					nightDiscountedFirstBlock = input.nightValue;
				}
			}
					
			var dayDiscountedFirstBlock = 0;
			if ( totalConsumption-options.firstBlockLimit > 0 )
			{
				if ( options.firstBlockLimit-options.powerCredit > 0 )
				{
					dayDiscountedFirstBlock = options.powerCredit-nightDiscountedFirstBlock;
				}
				else
				{
					dayDiscountedFirstBlock = options.firstBlockLimit-nightDiscountedFirstBlock;
				}
			}
			else
			{
				if ( totalConsumption-options.powerCredit > 0 )
				{
					dayDiscountedFirstBlock = options.powerCredit-nightDiscountedFirstBlock;
				}
				else
				{
					dayDiscountedFirstBlock = totalConsumption-nightDiscountedFirstBlock;
				}
			}
			
			var nightNotDiscountedFirstBlock = 0;			
			if ( totalConsumption-options.firstBlockLimit > 0 )
			{
				if ( options.firstBlockLimit-options.powerCredit > 0 )
				{
					nightNotDiscountedFirstBlock = Math.round((options.firstBlockLimit-options.powerCredit)*nightConsumptionFactor);
				}
				else
				{
					nightNotDiscountedFirstBlock = 0;
				}
			}
			else
			{
				if ( totalConsumption-options.powerCredit > 0 )
				{
					nightNotDiscountedFirstBlock = Math.round((totalConsumption-options.powerCredit)*nightConsumptionFactor);
				}
				else
				{
					nightNotDiscountedFirstBlock = 0;
				}
			}
			
			var dayNotDiscountedFirstBlock = 0;
			if ( totalConsumption-options.firstBlockLimit > 0 )
			{
				if ( options.firstBlockLimit-options.powerCredit > 0 )
				{
					dayNotDiscountedFirstBlock = options.firstBlockLimit-options.powerCredit-nightNotDiscountedFirstBlock;
				}
				else
				{
					dayNotDiscountedFirstBlock = 0;
				}
			}
			else
			{
				if ( totalConsumption-options.powerCredit > 0 )
				{
					dayNotDiscountedFirstBlock = totalConsumption-options.powerCredit-nightNotDiscountedFirstBlock;
				}
				else
				{
					dayNotDiscountedFirstBlock = 0;
				}
			}
			
			var nightDiscountedSecondBlock = 0;
			if ( totalConsumption-options.firstBlockLimit > 0 )
			{
				if ( totalConsumption-options.powerCredit > 0 )
				{
					if ( options.firstBlockLimit-options.powerCredit > 0 )
					{
						nightDiscountedSecondBlock = 0;
					}
					else
					{
						if ( options.secondBlockLimit-options.powerCredit > 0 )
						{
							nightDiscountedSecondBlock = Math.round( (options.powerCredit-options.firstBlockLimit)*nightConsumptionFactor );
						}
						else
						{
							nightDiscountedSecondBlock = Math.round( (options.secondBlockLimit-options.firstBlockLimit)*nightConsumptionFactor );
						}
					}
				}
				else
				{
					if ( totalConsumption-options.secondBlockLimit > 0 )
					{
						nightDiscountedSecondBlock = Math.round( (options.secondBlockLimit-options.firstBlockLimit)*nightConsumptionFactor );
					}
					else
					{
						nightDiscountedSecondBlock = Math.round( (totalConsumption-options.firstBlockLimit)*nightConsumptionFactor );
					}
				}
			}
			else
			{
				nightDiscountedSecondBlock = 0;
			}
			
			var dayDiscountedSecondBlock = 0;
			if ( totalConsumption-options.firstBlockLimit > 0 )
			{
				if ( totalConsumption-options.powerCredit > 0 )
				{
					if ( options.firstBlockLimit-options.powerCredit > 0 )
					{
						dayDiscountedSecondBlock = 0;
					}
					else
					{
						if ( options.secondBlockLimit-options.powerCredit > 0 )
						{
							dayDiscountedSecondBlock = options.powerCredit-options.firstBlockLimit-nightDiscountedSecondBlock;
						}
						else
						{
							dayDiscountedSecondBlock = options.secondBlockLimit-options.firstBlockLimit-nightDiscountedSecondBlock;
						}
					}
				}
				else
				{
					if ( totalConsumption-options.secondBlockLimit > 0 )
					{
						dayDiscountedSecondBlock = options.secondBlockLimit-options.firstBlockLimit-nightDiscountedSecondBlock;
					}
					else
					{
						dayDiscountedSecondBlock = totalConsumption-options.firstBlockLimit-nightDiscountedSecondBlock;
					}
				}
			}
			else
			{
				dayDiscountedSecondBlock = 0;
			}
			
			var nightNotDiscountedSecondBlock = 0;			
			if ( totalConsumption-options.secondBlockLimit > 0 )
			{
				if ( options.powerCredit-options.secondBlockLimit > 0 )
				{
					nightNotDiscountedSecondBlock = 0
				}
				else
				{
					if ( options.powerCredit-options.firstBlockLimit > 0 )
					{
						nightNotDiscountedSecondBlock = Math.round( (options.secondBlockLimit-options.powerCredit)*nightConsumptionFactor );
					}
					else
					{
						nightNotDiscountedSecondBlock = Math.round( (options.secondBlockLimit-options.firstBlockLimit)*nightConsumptionFactor );
					}
				}
			}
			else
			{
				if ( totalConsumption-options.firstBlockLimit > 0 )
				{
					if ( totalConsumption-options.powerCredit > 0 )
					{
						nightNotDiscountedSecondBlock = input.nightValue-nightDiscountedSecondBlock-nightNotDiscountedFirstBlock-nightDiscountedFirstBlock;
					}
					else
					{
						nightNotDiscountedSecondBlock = 0;
					}
				}
				else
				{
					nightNotDiscountedSecondBlock = 0;
				}
			}
			
			var dayNotDiscountedSecondBlock = 0;
			if ( totalConsumption-options.secondBlockLimit > 0 )
			{
				if ( options.powerCredit-options.secondBlockLimit > 0 )
				{
					dayNotDiscountedSecondBlock = 0;
				}
				else
				{
					if ( options.powerCredit-options.firstBlockLimit > 0 )
					{
						dayNotDiscountedSecondBlock = options.secondBlockLimit-options.powerCredit-nightNotDiscountedSecondBlock;
					}
					else
					{
						dayNotDiscountedSecondBlock = options.secondBlockLimit-options.firstBlockLimit-nightNotDiscountedSecondBlock;
					}
				}
			}
			else
			{
				if ( totalConsumption-options.firstBlockLimit > 0 )
				{
					if ( totalConsumption-options.powerCredit > 0 )
					{
						dayNotDiscountedSecondBlock = input.dayValue-dayDiscountedSecondBlock-dayNotDiscountedFirstBlock-dayDiscountedFirstBlock;
					}
					else
					{
						dayNotDiscountedSecondBlock = 0;
					}
				}
				else
				{
					dayNotDiscountedSecondBlock = 0;
				}
			}
			
			var nightDiscountedThirdBlock = 0;
			if ( totalConsumption-options.secondBlockLimit > 0 )
			{
				if ( totalConsumption-options.powerCredit > 0 )
				{
					if ( options.secondBlockLimit-options.powerCredit > 0 )
					{
						nightDiscountedThirdBlock = 0;
					}
					else
					{
						nightDiscountedThirdBlock = Math.round( (options.powerCredit-options.secondBlockLimit)*nightConsumptionFactor );
					}
				}
				else
				{
					nightDiscountedThirdBlock = Math.round( (totalConsumption-options.secondBlockLimit)*nightConsumptionFactor );
				}
			}
			else
			{
				nightDiscountedThirdBlock = 0;
			}
			
			var dayDiscountedThirdBlock = 0;
			if ( totalConsumption-options.secondBlockLimit > 0 )
			{
				if ( totalConsumption-options.powerCredit > 0 )
				{
					if ( options.secondBlockLimit-options.powerCredit > 0 )
					{
						dayDiscountedThirdBlock = 0;
					}
					else
					{
						dayDiscountedThirdBlock = options.powerCredit-options.secondBlockLimit-nightDiscountedThirdBlock;
					}
				}
				else
				{
					dayDiscountedThirdBlock = totalConsumption-options.secondBlockLimit-nightDiscountedThirdBlock;
				}
			}
			else
			{
				dayDiscountedThirdBlock = 0;
			}
			
			var nightNotDiscountedThirdBlock = 0;
			if ( totalConsumption-options.secondBlockLimit > 0 )
			{
				if ( totalConsumption-options.powerCredit > 0 )
				{
					nightNotDiscountedThirdBlock = input.nightValue-nightNotDiscountedFirstBlock-nightDiscountedFirstBlock-nightDiscountedThirdBlock-nightNotDiscountedSecondBlock-nightDiscountedSecondBlock;
				}
				else
				{
					nightNotDiscountedThirdBlock = 0;
				}
			}
			else
			{
				nightNotDiscountedThirdBlock = 0;
			}
			
			var dayNotDiscountedThirdBlock = 0;
			if ( totalConsumption-options.secondBlockLimit > 0 )
			{
				if ( totalConsumption-options.powerCredit > 0 )
				{
					dayNotDiscountedThirdBlock = input.dayValue-dayNotDiscountedFirstBlock-dayDiscountedFirstBlock-dayDiscountedThirdBlock-dayNotDiscountedSecondBlock-dayDiscountedSecondBlock;
				}
				else
				{
					dayNotDiscountedThirdBlock = 0;
				}
			}
			else
			{
				dayNotDiscountedThirdBlock = 0;
			}
			
			var totalFirstBlock = round(nightDiscountedFirstBlock*discountedFirstBlockTax/100*options.nightFactor
				+ dayDiscountedFirstBlock*discountedFirstBlockTax/100*options.dayFactor, 2) 
				+ round(nightNotDiscountedFirstBlock*options.firstBlockTax/100*options.nightFactor 
				+ dayNotDiscountedFirstBlock*options.firstBlockTax/100*options.dayFactor, 2);
				
			var totalSecondBlock = round(nightDiscountedSecondBlock*discountedSecondBlockTax/100*options.nightFactor 
				+ dayDiscountedSecondBlock*discountedSecondBlockTax/100*options.dayFactor, 2) 
				+ round(nightNotDiscountedSecondBlock*options.secondBlockTax/100*options.nightFactor 
				+ dayNotDiscountedSecondBlock*options.secondBlockTax/100*options.dayFactor, 2);
			
			var totalThirdBlock = round(nightDiscountedThirdBlock*discountedThirdBlockTax/100*options.nightFactor 
				+ dayDiscountedThirdBlock*discountedThirdBlockTax/100*options.dayFactor, 2) 
				+ round(nightNotDiscountedThirdBlock*options.thirdBlockTax/100*options.nightFactor 
				+ dayNotDiscountedThirdBlock*options.thirdBlockTax/100*options.dayFactor, 2);
			
			return round(totalFirstBlock + totalSecondBlock + totalThirdBlock, 2);
		}
	};
};

function AppController()
{
	var pages = null;
	var mainPage = null;
	var optionsPage = null;
	var activePage = null;
	
	var storage = OptionsStorage();
	var bill = BillCalculator( storage );
	var errorMessage = 'Пожалуйста, заполние все поля корректными данными.';
	return {
		init: function()
		{
			console.log('Subscribe to pagecontainershow event');
			$( document ).on( 'pagecontainershow', function ( e, ui ) {
				if ( !pages )
				{
					console.log('Initializing page views');
					mainPage = MainPageView( $( 'div#main' ) );
					optionsPage = OptionsPageView( $( 'div#options' ) );
					
					pages = {
						'main': mainPage,
						'options': optionsPage
					};
					
					console.log('Setting handler on calculate button');
					mainPage.onCalculateButtonClick( function( event ) {
						console.log('mainPage.onCalculateButtonClick');
						page = event.data;
						if ( page.validate() )
						{
							page.showResult( bill.calculate( page.getInputValues() ) );
						}
						else
						{
							alert( errorMessage );
						}
					});
					
					console.log('Setting handler on save button in options dialog');
					optionsPage.onSaveButtonClick( function( event ) {
						console.log('optionsPage.onSaveButtonClick');
						page = event.data;
						if ( page.validate() )
						{
							storage.setOptions( page.getInputValues() );
						}
						else
						{
							alert( errorMessage );
							return false;
						}
					});
				}
				activePage = pages[ui.toPage.attr( 'id' )];
				if ( activePage == optionsPage )
				{
					console.log('Active page: options');
					optionsPage.showStoredOptions( storage.getOptions() );
				}
				else
				{
					console.log('Active page: main');
				}
			});
		}
	};
};
