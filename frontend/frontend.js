function calculateTotalPrice() {
    const zone = document.getElementById('zone').value;
    const organization_id = document.getElementById('organization_id').value;
    const total_distance = document.getElementById('total_distance').value;
    const item_type = document.getElementById('item_type').value;

    const requestData = {
        zone: zone,
        organization_id: organization_id,
        total_distance: parseFloat(total_distance),
        item_type: item_type
    };

        // Check if any of the input fields are empty
    if (!zone || !organization_id || !total_distance || !item_type) {
        alert('Missing required parameters');
        return;
    }

    fetch('https://food-price-api.onrender.com/cost', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('total_price').innerText = `Total Price: ${data.total_price}`;
    })
    .catch(error => {
        document.getElementById('total_price').innerText = `Error`;
    });
}
