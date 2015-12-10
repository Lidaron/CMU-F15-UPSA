/* Thought AIs
-------------------------------------------------- */
module.exports = function (APIs) {
	return new ThoughtAI(APIs);
};

function ThoughtAI(APIs) {
	this.APIs = APIs;
}

ThoughtAI.prototype.conceptInsightsText = function (text, callback) {
	var APIs = this.APIs;
	APIs.extractConceptMentions({
		text: text
	}, function (result) {
		if (!("annotations" in result)) {
			return callback("N/A (Annotations unavailable)", []);
		}
		
		var conceptids = [];
		for (var i = 0; i < 3 && i < result.annotations.length; i++) {
			var item = result.annotations[i];
			conceptids.push(item.concept.id);
		}
		
		if (conceptids.length === 0) {
			return callback("N/A (No concepts found)", []);
		}
		
		APIs.conceptualSearch({
			limit: 3,
			document_fields: { user_fields: 1 },
			ids: conceptids
		}, function (data) {
			if (!("results" in data)) {
				return callback("N/A (Conceptual search results unavailable)", [])
			}
			
			var links = [];
			data.results.forEach(function (result) {
				if (result.score < 0.66) return;
				links.push(result.user_fields.url);
			});
			
			console.log(links);
			callback(links.length ? links.join("\n") : "N/A (all under 66% confidence)", links);

		}, function (err) {
			callback("N/A (Error retrieving conceptual search results)", []);
		});
		
	}, function (err) {
		callback("N/A (Error retrieving concept mentions)", []);
	});
};

ThoughtAI.prototype.alchemyConceptTaggingText = function (text, callback) {
	var APIs = this.APIs;
	APIs.alchemyConceptTagging(text, function (result) {
		if (!("concepts" in result)) {
			return callback("N/A (Concept tagging unavailable)");
		}
		
		var concepts = [];
		result.concepts.forEach(function (concept) {
			if (parseFloat(concept.relevance) < 0.66) return;
			concepts.push(concept.text + " -- " + concept.relevance);
		});
		
		console.log(concepts);
		callback(concepts.length ? concepts.join("\n") : "N/A (all under 66% relevance)");
		
	}, function (err) {
		callback("N/A (Error retrieving concept tagging)");
	});
};

ThoughtAI.prototype.alchemyTaxonomyText = function (text, callback) {
	var APIs = this.APIs;
	APIs.alchemyTaxonomy(text, function (result) {
		if (!("taxonomy" in result)) {
			return callback("N/A (Taxonomy unavailable)");
		} 
		
		var tags = [];
		result.taxonomy.forEach(function (tag) {
			if (parseFloat(tag.score) < 0.25) return;
			tags.push(tag.label + " -- " + tag.score);
		});
		
		console.log(tags);
		callback(tags.length ? tags.join("\n") : "N/A (all under 25% score)");
		
	}, function (err) {
		callback("N/A (Error retrieving taxonomy)");
	});
};

ThoughtAI.prototype.alchemyKeywordsText = function (text, callback) {
	var APIs = this.APIs;
	APIs.alchemyKeywords(text, function (result) {
		if (!("keywords" in result)) {
			return callback("N/A (Keywords unavailable)");
		}
		
		var keywords = [];
		result.keywords.forEach(function (keyword) {
			if (parseFloat(keyword.relevance) < 0.25) return;
			keywords.push(keyword.text + " -- " + keyword.relevance);
		});
		
		console.log(keywords);
		callback(keywords.length ? keywords.join("\n") : "N/A (all under 25% score)");
		
	}, function (err) {
		callback("N/A (Error retrieving keywords)");
	});
};
