<template>
  <div class="error-box bg-blue-grey-lighten-5">
    <div class="py-12">
      <div class="text-center">
        <h1 class="error-title text-error">404</h1>
        <h3 class="text-uppercase error-subtitle">PAGE NOT FOUND !</h3>
        <p class="text-muted mt-4 mb-4">YOU SEEM TO BE TRYING TO FIND HIS WAY HOME</p>
        <v-btn color="info" to="/">Go to Home</v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style lang="scss">
.error-box {
  height: 100%;
  width: 100%;
  position: fixed;
  background-position: top center;
  background-repeat: no-repeat;
  /* Asegúrate de que esta ruta coincida con la ubicación de tu imagen en Vite */
  background: url("@/assets/images/background/error-bg.jpg");
  background-size: cover;
}
.error-title {
  font-size: 210px;
  font-weight: 900;
  text-shadow: 4px 4px 0 #fff, 6px 6px 0 #343a40;
  line-height: 210px;
}

@media (max-width: 991px) {
  .error-title {
    font-size: 120px;
    line-height: 120px;
  }
}

@media (max-width: 767px) {
  .error-title {
    font-size: 40px;
    line-height: 40px;
  }
}
</style>