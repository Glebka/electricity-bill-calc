function AppController()
{
	return {
		init: function()
		{
			
		}
	};
};

function MainPageView( pageElement )
{
	var inputFields = pageElement.find('input[type="number"]');
	var calculateButton = pageElement.find('#btnCalculate');
	var resultField = pageElement.find('input#forPay');
	
	return {
		getInputValues: function()
		{
			var result = {};
			inputFields.each(function(index, element) {
				result[element.attr('id')] = element.val();
			});
			return result;
		},
		
	};
};