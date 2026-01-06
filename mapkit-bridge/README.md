# mapkit-bridge

Provides MapKit-based place search and map snapshot previews for iOS.

## Install

```bash
npm install mapkit-bridge
npx cap sync
```

## API

<docgen-index>

* [`echo(...)`](#echo)
* [`ping()`](#ping)
* [`searchPlaces(...)`](#searchplaces)
* [`getSnapshot(...)`](#getsnapshot)
* [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### echo(...)

```typescript
echo(options: { value: string; }) => Promise<{ value: string; }>
```

| Param         | Type                            |
| ------------- | ------------------------------- |
| **`options`** | <code>{ value: string; }</code> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### ping()

```typescript
ping() => Promise<{ value: string; }>
```

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### searchPlaces(...)

```typescript
searchPlaces(options: { query: string; near?: { lat: number; lng: number; }; }) => Promise<{ results: PlaceResult[]; }>
```

| Param         | Type                                                                  |
| ------------- | --------------------------------------------------------------------- |
| **`options`** | <code>{ query: string; near?: { lat: number; lng: number; }; }</code> |

**Returns:** <code>Promise&lt;{ results: PlaceResult[]; }&gt;</code>

--------------------


### getSnapshot(...)

```typescript
getSnapshot(options: SnapshotOptions) => Promise<{ imageData: string; address?: string; }>
```

| Param         | Type                                                        |
| ------------- | ----------------------------------------------------------- |
| **`options`** | <code><a href="#snapshotoptions">SnapshotOptions</a></code> |

**Returns:** <code>Promise&lt;{ imageData: string; address?: string; }&gt;</code>

--------------------


### Interfaces


#### PlaceResult

| Prop          | Type                |
| ------------- | ------------------- |
| **`name`**    | <code>string</code> |
| **`address`** | <code>string</code> |
| **`lat`**     | <code>number</code> |
| **`lng`**     | <code>number</code> |


#### SnapshotOptions

| Prop             | Type                |
| ---------------- | ------------------- |
| **`lat`**        | <code>number</code> |
| **`lng`**        | <code>number</code> |
| **`width`**      | <code>number</code> |
| **`height`**     | <code>number</code> |
| **`spanMeters`** | <code>number</code> |

</docgen-api>
