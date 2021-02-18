<template>
  <div class="container">
    <div class="row">
      <dropzone></dropzone>
    </div>
    <div class="row">
      <browser></browser>
    </div>
  </div>
</template>
<script>
import Dropzone from '../components/Dropzone'
import Browser from '../components/Browser'
export default {
  name: "UploadFiles",
  components: {
    Dropzone,
    Browser
  },
  methods: {

  },
  async created(){
      const claims = await this.$auth.getIdTokenClaims();
      if(claims === undefined) return;
      const id_token = claims.__raw;
      if (!this.$cookies.isKey("token"))
        this.$cookies.set("token",id_token,"30MIN","/upload");  
  }
}
</script>
<style lang="scss">
form.dropzone{
  width: 100%;
  transition: all 0.2s linear;
  border: 2px dashed #ccc;
  background-color: #fafafa;
  min-height: initial;
  &:hover{
    border-color: #3498db;
    background-color: white;
    .dz-message{
      .dropzone-title{
        color: #3498db;
      }
    }
  }
  .dz-message{
    color: #666;
    span{
      line-height: 1.8;
      font-size: 13px;
      letter-spacing: 0.4px;
      span.dropzone-title{
        display: block;
        color: #888;
        font-size: 1.25em;
      }
      span.dropzone-info{
        display: block;
        color: #a8a8a8;
      }
    }
  }
}
</style>
