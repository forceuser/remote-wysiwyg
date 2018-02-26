module.exports = {
    "parser": "babel-eslint",
    "parserOptions": {
        "sourceType": "module"
    },
    "plugins": [
        "babel",
        "import"
    ],
    "extends": [
        "eslint:recommended",
    ],
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    "settings": {
        "import/external-module-folders": ["node_modules", "jspm_packages"],
        "import/resolve": {
            "moduleDirectory": [
                "node_modules",
                "."
            ]
        },
        "import/resolver": {
            "node": true
        }
    },
    "rules": {
		// BASIC
		"require-yield": 0,
		"no-this-before-super": 2,

		// STYLE
		"indent": [2, "tab", {"SwitchCase": 1}],
		"eol-last": 2,
		// "linebreak-style": ["error", "unix"],

		"quotes": ["error", "double", {"allowTemplateLiterals": true}],
        "semi": ["error", "always"],
		"curly": [2, "all"],
		"dot-notation": 2,
		"arrow-parens": 0,
		// "new-cap": 2,
		"one-var": [2, "never"],

		// spacing
        "generator-star-spacing": 0,
        "object-curly-spacing": 0,
		"array-bracket-spacing": [2, "never"],
		"computed-property-spacing": [2, "never"],
		"key-spacing": [2, {"beforeColon": false, "afterColon": true, "mode": "strict"}],
		"comma-spacing": [2, {
            "before": false,
            "after": true
        }],
        "comma-dangle": ["error", {
            "arrays": "always-multiline",
            "objects": "always-multiline",
            "imports": "never",
            "exports": "never",
            "functions": "ignore"
        }],
		"space-infix-ops": 2,
        "space-in-parens": [2, "never"],
		"space-before-blocks": [2, "always"],
        "space-before-function-paren": [2, "always"],
        "space-unary-ops": [2, {
            "words": true,
            "nonwords": false
        }],
		"spaced-comment": ["error", "always"],
		"keyword-spacing": [2, {"before": true, "after": true}],
        "arrow-spacing": ["error", { "before": true, "after": true }],

        //======================================================================

		"no-useless-rename": [2, {
		    "ignoreDestructuring": false,
		    "ignoreImport": false,
		    "ignoreExport": false
		}],
		"no-trailing-spaces": 2,
		// "no-underscore-dangle": 2,
		"no-multi-spaces": 2,
		"no-dupe-keys": 2,
		"no-duplicate-case": 2,
		"no-dupe-args": 2,
		"no-sparse-arrays": 2,
		"no-extra-semi": 2,
		"no-func-assign": 2,
        "no-spaced-func": 2,
        "no-unused-vars": 1,
		"no-inner-declarations": 2,
        "no-console": 0,
        "no-var": 1,
		"no-self-assign": 2,
		"no-self-compare": 2,
		"no-cond-assign": 1,
		"no-useless-concat": 2,
		"no-useless-escape": 0,
		// "no-use-before-define": 2,
		"no-implicit-coercion": 0,
		"no-new-func": 0,
		"no-new-wrappers": 2,
		// "func-names": ["error", "always"],

		"brace-style": [1, "stroustrup", { "allowSingleLine": true }],
		"wrap-iife": [2, "inside"],
		"yoda": [2, "never"],
        "prefer-const": 1,
        "prefer-template": 0,
        "prefer-arrow-callback": 1,

		//======================================================================
        "babel/new-cap": [2, {
            "newIsCap": true,
            "capIsNew": false
        }],
        "babel/object-curly-spacing": [2, "never"],
        "object-shorthand": 1,
        //======================================================================
        // disabled because of https://github.com/benmosher/eslint-plugin-import/issues/268
        // "import/default": 2,
        "import/export": 2,
        // "import/extensions": [2, {
        //     "js": "never",
        //     "json": "never",
        //     "jsx": "never"
        // }],
        "import/imports-first": 2,
        // disabled because of https://github.com/benmosher/eslint-plugin-import/issues/268
        // "import/named": 2,
        "import/namespace": 2,
        // "import/newline-after-import": 2,
        "import/no-amd": 2,
        // enable this sometime in the future when Node.js has ES2015 module support
        // "import/no-commonjs": 2,
        // looks useful, but too unstable at the moment
        // "import/no-deprecated": 2,
        "import/no-extraneous-dependencies": 0,
        "import/no-mutable-exports": 2,
        "import/no-named-as-default-member": 2,
        "import/no-named-as-default": 2,
        // disabled because of https://github.com/benmosher/eslint-plugin-import/issues/275
        // "import/no-unresolved": [2, {commonjs: true}],
        "import/order": 2
    }
};
