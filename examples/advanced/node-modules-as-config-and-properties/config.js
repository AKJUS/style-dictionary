import StyleDictionary from 'style-dictionary';
import { formats, transforms, transformGroups, transformTypes } from 'style-dictionary/enums';
import tokens from './tokens/index.js';
// Rather than have Style Dictionary handle the merging of token files,
// you could use node module export/require to do it yourself. This will
// allow you to not have to copy object namespaces like you normally would.
// Take a look at any of the .js files in components/ or tokens/

const { cssVariables, scssVariables, javascriptEs6, json } = formats;
const { css, js } = transformGroups;
const { attributeCti, colorHex, colorRgb } = transforms;
const { value: transformTypeValue, name } = transformTypes;
const buildPath = 'build/';

// You can still add custom transforms and formats like you
// normally would and reference them in the config below.
StyleDictionary.registerTransform({
  name: 'myRegisteredTransform',
  type: transformTypeValue,
  filter: (token) => token.attributes.category === 'size',
  transform: (token) => `${parseInt(token.value) * 16}px`,
});

StyleDictionary.registerFormat({
  name: 'myRegisteredFormat',
  format: ({ dictionary }) => {
    return dictionary.allTokens.map((token) => token.value).join('\n');
  },
});

// You can export a plain JS object and point the Style Dictionary CLI to it,
// similar to webpack.
export default {
  // We are relying on node modules to merge all the objects together
  // thus we only want to reference top level node modules that export
  // the whole objects.
  source: ['tokens/index.js', 'components/index.js'],
  // If you don't want to call the registerTransform method a bunch of times
  // you can override the whole hooks object directly. This works because
  // the .extend method copies everything in the config
  // to itself, allowing you to override things. It's also doing a deep merge
  // to protect from accidentally overriding nested attributes.
  hooks: {
    transforms: {
      // Now we can use the transform 'myTransform' below
      myTransform: {
        type: name,
        transform: (token) => token.path.join('_').toUpperCase(),
      },
    },
    // Same with formats, you can now write them directly to this config
    // object. The name of the format is the key.
    formats: {
      myFormat: ({ dictionary }) => {
        return dictionary.allTokens.map((token) => `${token.name}: ${token.value}`).join('\n');
      },
    },
  },
  // You can also bypass the merging of files Style Dictionary does
  // by adding a 'tokens' object directly like this:
  //
  // tokens: tokens,
  platforms: {
    custom: {
      // Using the custom transforms we defined above
      transforms: [attributeCti, 'myTransform', 'myRegisteredTransform', colorHex],
      buildPath: buildPath,
      files: [
        {
          destination: 'variables.yml',
          // Using the custom format defined above
          format: 'myFormat',
        },
      ],
    },

    css: {
      transformGroup: css,
      buildPath: buildPath,
      files: [
        {
          destination: 'variables.css',
          format: cssVariables,
        },
      ],
    },

    scss: {
      // This works, we can create new transform arrays on the fly and edit built-ins
      transforms: StyleDictionary.hooks.scss?.concat(colorRgb),
      buildPath: buildPath,
      files: [
        {
          destination: 'variables.scss',
          format: scssVariables,
        },
      ],
    },

    js: {
      transforms: StyleDictionary.hooks.js?.concat('myRegisteredTransform'),
      buildPath: buildPath,
      // If you want to get super fancy, you can use node modules
      // to create a tokens object first, and then you can
      // reference attributes of that object. This allows you to
      // output 1 file per color namespace.
      files: Object.keys(tokens.color).map((colorType) => ({
        destination: `${colorType}.js`,
        format: javascriptEs6,
        // Filters can be functions that return a boolean
        filter: (token) => token.attributes.type === colorType,
      })),
    },

    // You can still use built-in transformGroups and formats like before
    json: {
      transformGroup: js,
      buildPath: buildPath,
      files: [
        {
          destination: 'tokens.json',
          format: json,
        },
      ],
    },
  },
};
