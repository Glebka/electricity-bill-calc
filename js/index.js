function MainPageView( pageElement )
{
	var inputFields = pageElement.find( 'input[type="number"]' );
	var calculateButton = pageElement.find( '#btnCalculate' );
	var resultField = pageElement.find( 'input#forPay' );
	var form = pageElement.find( 'form#measurements' );
	
	return {
		getInputValues: function()
		{
			var result = {};
			inputFields.each( function( index, dom ) {
				element = $(dom);
				result[element.attr('id')] = element.val();
			});
			return result;
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
	return {};
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
	return {
		getOptions: function()
		{
			if ( typeof(Storage) !== "undefined" ) 
			{
				var storedOptions = localStorage.getItem( 'options' );
				if ( storedOptions )
				{
					options = JSON.parse( storedOptions );
				}
			}
			else
			{
				var errorText = "Critical error: local storage is not supported";
				console.error( errorText );
				alert( errorText );
			}
			return options;
		},
		setOptions: function( opt )
		{
			if ( typeof(Storage) !== "undefined" ) 
			{
				var serializedOptions = JSON.stringify( opt );
				localStorage.setItem( 'options', serializedOptions );
			}
			else
			{
				var errorText = "Critical error: local storage is not supported";
				console.error( errorText );
				alert( errorText );
			}
		}
	};
};

function BillCalculator( optionsStorage )
{
	var storage = optionsStorage;
	
	function round(num, places) 
	{ 
		return +(Math.round(num + "e+" + places)  + "e-" + places);
	}
	
	return {
		calculate: function( input )
		{
			var options = storage.getOptions();
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
						dayDiscountedThirdBlock = options.powerCredit-options.secondBlockLimit-dayDiscountedThirdBlock;
					}
				}
				else
				{
					dayDiscountedThirdBlock = totalConsumption-options.secondBlockLimit-dayDiscountedThirdBlock;
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
					nightNotDiscountedThirdBlock = input.nightValue-nightNotDiscountedFirstBlock-nightDiscountedFirstBlock-dayDiscountedThirdBlock-nightNotDiscountedSecondBlock-nightDiscountedSecondBlock;
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
			
			var totalFirstBlock = round( nightDiscountedFirstBlock*discountedFirstBlockTax/100*options.nightFactor
				+ dayDiscountedFirstBlock*discountedFirstBlockTax/100*options.dayFactor, 2) 
				+ round(nightNotDiscountedFirstBlock*options.firstBlockTax/100*options.nightFactor 
				+ dayNotDiscountedFirstBlock*options.firstBlockTax/100*options.dayFactor, 2);
				
			var totalSecondBlock = round(nightDiscountedSecondBlock*discountedSecondBlockTax/100*options.nightFactor 
				+ dayDiscountedSecondBlock*discountedSecondBlockTax/100*options.dayFactor,2) 
				+ round(nightNotDiscountedSecondBlock*options.secondBlockTax/100*options.nightFactor 
				+ dayNotDiscountedSecondBlock*options.secondBlockTax/100*options.dayFactor,2);
			
			var totalThirdBlock = round(nightDiscountedThirdBlock*discountedThirdBlockTax/100*options.nightFactor 
				+ dayDiscountedThirdBlock*discountedThirdBlockTax/100*options.dayFactor,2) 
				+ round(nightNotDiscountedThirdBlock*options.thirdBlockTax/100*options.nightFactor 
				+ dayNotDiscountedThirdBlock*options.thirdBlockTax/100*options.dayFactor,2);
			
			return round( totalFirstBlock + totalSecondBlock + totalThirdBlock, 2 );
		}
	};
};

function AppController()
{
	var pages = null;
	var mainPage = null;
	var optionsPage = null;
	var activePage = null;
	
	var bill = BillCalculator( OptionsStorage() );
	
	return {
		init: function()
		{
			$( document ).on( 'pagecontainershow', function ( e, ui ) {
				if ( !pages )
				{
					mainPage = MainPageView( $( 'div#main' ) );
					optionsPage = OptionsPageView( $( 'div#options' ) );
					
					pages = {
						'main': mainPage,
						'options': optionsPage
					};
					
					mainPage.onCalculateButtonClick( function( event ) {
						page = event.data;
						page.showResult( bill.calculate( page.getInputValues() ) );
					});
				}
				activePage = pages[ui.toPage.attr( 'id' )];
			});
		}
	};
};

var controller = AppController();
controller.init();