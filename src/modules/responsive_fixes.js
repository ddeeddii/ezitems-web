// Handle changing to inline when using incompatible widths
let responsiveState = 1

// Handle starting with low width
$(document).ready(function () {
	const width = $(window).width()
	if (width < 1200) {
		responsiveState = 2
		setSelectStyles()
	}
})

// Handle changing to low width (responsiveness)
$(window).resize(function () {
	const width = $(window).width()
	if (width < 1200 && responsiveState == 1) {
		responsiveState = 2
		setSelectStyles()
	} else if (width > 1200 && responsiveState == 2) {
		responsiveState = 1
		resetSelectStyles()
	}
})

function setSelectStyles() {
	$('#imageUpload').css({'display': 'inline'})

	$('#typeItemSelectors').css({
		'display': 'inline',
		'justify-content': '',
		'min-width': 'fit-content',
		'margin-top': '5px',
	})

	$('#imageUploadSpan').css({
		'margin-top': '5px',
		'margin-bottom': '5px',
	})
}

function resetSelectStyles() {
	$('#imageUpload').css({'display': ''})

	$('#typeItemSelectors').css({
		'display': 'flex',
		'justify-content': 'flex-end',
		'min-width': '',
		'margin-top': '',
	})

	$('#imageUploadSpan').css({
		'margin-top': '',
		'margin-bottom': '',
	})
}