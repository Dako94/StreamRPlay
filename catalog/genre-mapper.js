module.exports = function(category) {
    switch(category) {
        case 'Serie TV': return ['Drama'];
        case 'Film': return ['Movie'];
        case 'Documentario': return ['Documentary'];
        default: return [];
    }
};
