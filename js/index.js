$(function() {
    function getDestinations(data) {
        const strings = data.split(/\s+/);
        let destination = null;
        const doors = {};

        strings.find(string => {
            if(string === 'pkTRANSMixed') {
                return true;
            }

            if(matches = string.match(/^pkTRANSCase([A-Z]{3}\d{1})$/)) {
                destination = matches[1];
            }

            if(destination !== null && (matches = string.match(/FL(\d{3})/g))) {
                matches.forEach(match => {
                    doors[match] = destination;
                });
            }

            return false;
        })

        return doors;
    }
    
    function getDensities(data) {
        const strings = data.split(/\s+/);
        let destination = null;
        const destinations = {};

        strings.forEach(string => {
            if(matches = string.match(/^TEB9->([A-Z]{3}\d{1})$/)) {
                destination = matches[1];
            } else if(destination !== null) {
                if(!isNaN(string)) {
                    destinations[destination] = parseFloat(string);
                }

                destination = null;
            }
        });

        return destinations;
    }

    function getSide(door) {
        const northDoors = ['FL327','FL328','FL329','FL330','FL331','FL332','FL333','FL334','FL335','FL336','FL337','FL338','FL339','FL340','FL341','FL342','FL343','FL344'];
        const southDoors = ['FL108','FL109','FL110','FL111','FL112','FL113','FL114','FL115','FL116','FL117','FL118','FL119','FL120','FL121','FL122','FL123','FL124','FL125','FL126','FL127','FL128','FL129','FL130','FL131','FL132','FL133','FL134'];
    
        if(northDoors.includes(door)) {
            return 'north';
        } else if(southDoors.includes(door)) {
            return 'south';
        }

        return null;
    }

    function getDestinationCounts(data) {
        const destinationCounts = {};

        for(const [door, destination] of Object.entries(data)) {
            if(destination in destinationCounts) {
                ++ destinationCounts[destination];
            } else {
                destinationCounts[destination] = 1;
            }
        }

        return destinationCounts;
    }

    function getDensitySum(data) {
        return Object.entries(data).reduce((sum, door) => {
            return sum + (isNaN(door[1].adjustedDensity) ? 0 : door[1].adjustedDensity);
        }, 0);
    }

    function addPercent(data, densitySum) {
        for(const door in data) {
            data[door]['percent'] = (data[door].adjustedDensity / densitySum * 100).toFixed(1);
        }
    }

    function compare(a, b) {
        if(isNaN(a[1].adjustedDensity)) {
            return 1;
        }

        if(isNaN(b[1].adjustedDensity)) {
            return -1;
        }

        return b[1].adjustedDensity - a[1].adjustedDensity;
    }

    $('#destination-data').on('keyup paste', function() {
        const destinations = getDestinations($(this).val());

        if(Object.keys(destinations).length === 0) {
            $(this).attr('class', 'error');
        } else {
            $(this).attr('class', 'success');
        }
    });

    $('#density-data').on('keyup paste', function() {
        const densities = getDensities($(this).val());

        if(Object.keys(densities).length === 0) {
            $(this).attr('class', 'error');
        } else {
            $(this).attr('class', 'success');
        }
    });

    $('#process').on('click', function() {
        const destinations = getDestinations($('#destination-data').val());
        const densities = getDensities($('#density-data').val());

        if(Object.keys(destinations).length === 0 ||
           Object.keys(densities).length === 0) {
            return false;
        }

        const north = {};
        const south = {};
        const destinationCounts = getDestinationCounts(destinations);

        for(const [door, destination] of Object.entries(destinations)) {
            // What side is the door on?
            const side = getSide(door);

            // Get the density for the destination
            const density = destination[destination];

            const data = {
                destination: destination,
                count: destinationCounts[destination],
                density: densities[destination],
                adjustedDensity: densities[destination] / destinationCounts[destination]
            };

            // Add the door, destination, count, and density to the appropriate side
            if(side === 'north') {
                north[door] = data;
            } else if(side === 'south') {
                south[door] = data;
            }
        }

        addPercent(north, getDensitySum(north));
        addPercent(south, getDensitySum(south));

        let string = 'North\n';

        string += 'Door\tDestination\tDensity\tSplits\tAdjusted Density\tPercent\n';

        for(const [door, data] of Object.entries(north).sort(compare)) {
            const row = [door, data.destination, data.density, data.count - 1, data.adjustedDensity,
                data.percent];

            string += row.join('\t');
            string += '\n';
        }

        string += '\n\nSouth\n';

        string += 'Door\tDestination\tDensity\tSplits\tAdjusted Density\tPercent\n';

        for(const [door, data] of Object.entries(south).sort(compare)) {
            const row = [door, data.destination, data.density, data.count - 1, data.adjustedDensity,
                data.percent];

            string += row.join('\t');
            string += '\n';
        }

        $('#output').val(string);
    });

    $('#copy').on('click', function() {
        navigator.clipboard.writeText($('#output').val());
    });
});