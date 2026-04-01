module.exports = [
    {
        files: ["**/*.js"],
        languageOptions: {
            sourceType: "script",
            globals: {
                $: "readonly",
                jQuery: "readonly"
            }
        },
        rules: {
            // Add rules here.
        }
    }
];