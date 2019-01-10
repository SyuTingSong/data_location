const fs = require("fs");

const data = fs.readFileSync("list.json");
const list = JSON.parse(data);

const result = {};
Object.keys(list)
	.map(code => ({
		code,
		name: list[code],
		p: code.substr(0, 2),
		c: code.substr(0, 4),
		d: code,
	}))
	.forEach(o => {
		const { code, name } = o;
		if (code.match(/^\d{2}0000$/)) {
			result[code] = {
				label: name,
				value: name,
				children: [],
			};
		} else if (code.match(/^\d{4}00$/)) {
			const parent = result[`${o.p}0000`];
			result[code] = {
				label: name,
				value: name,
				children: [],
			};
			parent.children.push(result[code]);
		} else {
			const parent = result[`${o.c}00`] || result[`${o.p}0000`];
			const region = result[code] = {
				label: name,
				value: name,
				children: [],
			};
			const file = `town/${code}.json`;
			if (fs.existsSync(file)) {
				const town = JSON.parse(fs.readFileSync(file));
				Object.keys(town).forEach(code => {
					region.children.push({
						label: town[code],
						value: town[code],
					});
				});
			}
			parent.children.push(region);
		}
	});

const provinces = Object.keys(result)
	.filter(code => !!code.match(/^\d{2}0000$/))
	.map(code => result[code]);

const reverse = {};

const createMap = (nodes, ancestors = []) => {
	nodes.forEach(node => {
		if (!node.children || node.children.length === 0) {
			delete node.children;
			const fullValues = ancestors.concat([node.value]);
			reverse[fullValues.join("")] = fullValues;
		} else {
			createMap(node.children, ancestors.concat([node.value]));
		}
	});
};
createMap(provinces);
process.stdout.write(`export const district_map = ${JSON.stringify(reverse)};\n`);
process.stdout.write(`export const district = ${JSON.stringify(provinces)};\n`);
