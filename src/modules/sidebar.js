let sidebarOpen = false

function closeSidebar() {
	$('#sidebar').css({
		'width': '',
	})
	sidebarOpen = false
}

function openSidebar() {
	$('#sidebar').css({
		'width': '15%',
	})
	sidebarOpen = true
}

$(document).ready(function () {
	// Open the menu
	$('#menuBtn').click(function () {
		if (sidebarOpen) {
			closeSidebar()
		} else {
			openSidebar()
		}
	})

	$('#sidebar').click(function () {
		closeSidebar()
	})
})