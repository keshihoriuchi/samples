<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<div>Email: {data.email}</div>
<div><a href="/logout">ログアウト</a></div>
